import { APIGatewayProxyResult } from 'aws-lambda';
import { ApiResponse, ResponseMetadata } from '@/types/common.types';

// Re-export the ApiResponse type for convenience
export type { ApiResponse } from '@/types/common.types';

export const createSuccessResponse = <T>(
  data: T,
  correlationId: string,
  statusCode: number = 200
): APIGatewayProxyResult => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    metadata: {
      requestId: correlationId,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Correlation-ID',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(response)
  };
};

export const createErrorResponse = (
  statusCode: number,
  error: string,
  correlationId: string,
  details?: any
): APIGatewayProxyResult => {
  const response: ApiResponse = {
    success: false,
    error: {
      code: statusCode.toString(),
      message: error,
      details
    },
    metadata: {
      requestId: correlationId,
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };

  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'X-Correlation-ID': correlationId,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Correlation-ID',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
    },
    body: JSON.stringify(response)
  };
};
