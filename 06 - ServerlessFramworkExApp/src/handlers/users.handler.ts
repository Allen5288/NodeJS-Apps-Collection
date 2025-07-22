import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import { logger } from '@/utils/logger';
import { UserService } from '@/services/user.service';
import { httpMiddleware } from '@/middleware/http.middleware';
import { ApiResponse, createErrorResponse, createSuccessResponse } from '@/utils/responses';
import { validateRequest } from '@/utils/validation';
import { userCreateSchema, userUpdateSchema } from '@/validation/user.validation';

const userService = new UserService();

const userHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, queryStringParameters } = event;
  const correlationId = event.headers['x-correlation-id'] || 'unknown';

  try {
    logger.info('Processing user request', {
      correlationId,
      method: httpMethod,
      path: event.path
    });

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get single user
          const user = await userService.getUserById(pathParameters.id);
          if (!user) {
            return createErrorResponse(404, 'User not found', correlationId);
          }
          return createSuccessResponse(user, correlationId);
        } else {
          // List users with pagination
          const limit = parseInt(queryStringParameters?.limit || '20');
          const lastKey = queryStringParameters?.lastKey;
          const status = queryStringParameters?.status as any; // Allow string to enum conversion
          
          const result = await userService.listUsers({ limit, lastKey, status });
          return createSuccessResponse(result, correlationId);
        }

      case 'POST':
        // Create user
        const createData = validateRequest<any>(event.body, userCreateSchema);
        const newUser = await userService.createUser(createData);
        return createSuccessResponse(newUser, correlationId, 201);

      case 'PUT':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'User ID is required', correlationId);
        }
        // Update user
        const updateData = validateRequest<any>(event.body, userUpdateSchema);
        const updatedUser = await userService.updateUser(pathParameters.id, updateData);
        return createSuccessResponse(updatedUser, correlationId);

      case 'DELETE':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'User ID is required', correlationId);
        }
        // Soft delete user
        await userService.deleteUser(pathParameters.id);
        return createSuccessResponse({ message: 'User deleted successfully' }, correlationId);

      default:
        return createErrorResponse(405, 'Method not allowed', correlationId);
    }
  } catch (error) {
    logger.error('Error processing user request', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error) {
      if (error.message.includes('ValidationError')) {
        return createErrorResponse(400, error.message, correlationId);
      }
      if (error.message.includes('ConditionalCheckFailed')) {
        return createErrorResponse(409, 'User already exists or version conflict', correlationId);
      }
    }

    return createErrorResponse(500, 'Internal server error', correlationId);
  }
};

export const handler = middy(userHandler).use(httpMiddleware());
