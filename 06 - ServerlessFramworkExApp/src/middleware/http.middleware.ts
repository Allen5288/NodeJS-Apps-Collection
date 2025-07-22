import middy from '@middy/core';
import httpJsonBodyParser from '@middy/http-json-body-parser';
import httpEventNormalizer from '@middy/http-event-normalizer';
import httpErrorHandler from '@middy/http-error-handler';
import httpCors from '@middy/http-cors';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { nanoid } from 'nanoid';
import { createLogger } from '@/utils/logger';
import { config } from '@/utils/config';

// Correlation ID middleware
const correlationIdMiddleware = () => ({
  before: async (request: any) => {
    const event = request.event as APIGatewayProxyEvent;
    
    // Get correlation ID from header or generate new one
    const correlationId = event.headers[config.app.correlationIdHeader] || 
                         event.headers['x-correlation-id'] || 
                         event.headers['X-Correlation-Id'] ||
                         nanoid();
    
    // Add to event
    (event as any).correlationId = correlationId;
    (event as any).requestTimestamp = new Date().toISOString();
    
    // Add to context for logging
    (request.context as any).correlationId = correlationId;
  },
  after: async (request: any) => {
    const response = request.response as APIGatewayProxyResult;
    
    // Add correlation ID to response headers
    if (!response.headers) {
      response.headers = {};
    }
    response.headers[config.app.correlationIdHeader] = (request.event as any).correlationId;
  }
});

// Logging middleware
const loggingMiddleware = () => ({
  before: async (request: any) => {
    const event = request.event as APIGatewayProxyEvent;
    const logger = createLogger((event as any).correlationId);
    
    logger.info('Request started', {
      httpMethod: event.httpMethod,
      path: event.path,
      queryStringParameters: event.queryStringParameters,
      userAgent: event.headers['User-Agent'],
      sourceIp: event.requestContext.identity.sourceIp
    });
    
    // Add logger to context
    (request.context as any).logger = logger;
  },
  after: async (request: any) => {
    const event = request.event as APIGatewayProxyEvent;
    const response = request.response as APIGatewayProxyResult;
    const logger = (request.context as any).logger;
    
    logger.info('Request completed', {
      statusCode: response.statusCode,
      responseTime: Date.now() - new Date((event as any).requestTimestamp).getTime()
    });
  },
  onError: async (request: any) => {
    const logger = (request.context as any).logger;
    const error = request.error;
    
    logger.error('Request failed', error, {
      statusCode: (error as any).statusCode || 500,
      stack: error.stack
    });
  }
});

// Authentication middleware
const authMiddleware = () => ({
  before: async (request: any) => {
    const event = request.event as APIGatewayProxyEvent;
    
    // Skip auth for certain paths
    const publicPaths = ['/health', '/docs'];
    if (publicPaths.some(path => event.path.startsWith(path))) {
      return;
    }
    
    // Get user from request context (set by authorizer)
    const user = event.requestContext.authorizer?.user;
    if (user) {
      (event as any).user = JSON.parse(user);
    }
  }
});

// Validation middleware
const validationMiddleware = (schema?: any) => ({
  before: async (request: any) => {
    if (schema && request.event.body) {
      try {
        // Validation would be done here with the provided schema
        // For now, we'll assume the body is already parsed by httpJsonBodyParser
      } catch (error) {
        const validationError = new Error('Validation failed');
        (validationError as any).statusCode = 400;
        (validationError as any).details = error;
        throw validationError;
      }
    }
  }
});

// Error formatting middleware
const errorFormattingMiddleware = () => ({
  onError: async (request: any) => {
    const error = request.error;
    let statusCode = 500;
    let code = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    if (error.statusCode) {
      statusCode = error.statusCode;
    }

    if (error.code) {
      code = error.code;
    }

    if (error.message) {
      message = error.message;
    }

    if (error.details) {
      details = error.details;
    }

    const errorResponse = {
      success: false,
      error: {
        code,
        message,
        ...(details && { details })
      },
      metadata: {
        requestId: (request.event as any).correlationId,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    };

    request.response = {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        [config.app.correlationIdHeader]: (request.event as any).correlationId
      },
      body: JSON.stringify(errorResponse)
    };

    return request.response;
  }
});

// Main middleware factory
export const createHandler = (handler: (event: any, context: Context) => Promise<APIGatewayProxyResult>) => {
  return middy(handler)
    .use(httpEventNormalizer())
    .use(correlationIdMiddleware())
    .use(loggingMiddleware())
    .use(httpJsonBodyParser())
    .use(authMiddleware())
    .use(httpCors({
      origin: '*',
      headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Correlation-Id',
      methods: 'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
    }))
    .use(errorFormattingMiddleware())
    .use(httpErrorHandler());
};

// HTTP middleware stack factory
export const httpMiddleware = () => [
  httpEventNormalizer(),
  correlationIdMiddleware(),
  loggingMiddleware(),
  httpJsonBodyParser(),
  authMiddleware(),
  httpCors({
    origin: '*',
    headers: 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Correlation-Id',
    methods: 'GET,HEAD,OPTIONS,POST,PUT,PATCH,DELETE'
  }),
  errorFormattingMiddleware(),
  httpErrorHandler()
];

// Success response helper
export const successResponse = (data: any, statusCode: number = 200, metadata?: any): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      data,
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        ...metadata
      }
    })
  };
};

// Error response helper
export const errorResponse = (error: any, statusCode: number = 500): APIGatewayProxyResult => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: false,
      error: {
        code: error.code || 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
        ...(error.details && { details: error.details })
      },
      metadata: {
        timestamp: new Date().toISOString(),
        version: '1.0'
      }
    })
  };
};
