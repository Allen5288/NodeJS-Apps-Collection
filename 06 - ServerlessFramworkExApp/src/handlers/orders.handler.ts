import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import { logger } from '@/utils/logger';
import { OrderService } from '@/services/order.service';
import { httpMiddleware } from '@/middleware/http.middleware';
import { createErrorResponse, createSuccessResponse } from '@/utils/responses';
import { validateRequest } from '@/utils/validation';
import { orderCreateSchema, orderUpdateSchema } from '@/validation/order.validation';

const orderService = new OrderService();

const orderHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, queryStringParameters } = event;
  const correlationId = event.headers['x-correlation-id'] || 'unknown';

  try {
    logger.info('Processing order request', {
      correlationId,
      method: httpMethod,
      path: event.path,
    });

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get single order
          const order = await orderService.getOrderById(pathParameters.id);
          if (!order) {
            return createErrorResponse(404, 'Order not found', correlationId);
          }
          return createSuccessResponse(order, correlationId);
        } else {
          // List orders with filters and pagination
          const limit = parseInt(queryStringParameters?.limit || '20');
          const lastKey = queryStringParameters?.lastKey;
          const status = queryStringParameters?.status as any; // Allow string to enum conversion
          const userId = queryStringParameters?.userId;
          const startDate = queryStringParameters?.startDate;
          const endDate = queryStringParameters?.endDate;

          const result = await orderService.searchOrders({
            limit,
            lastKey,
            status,
            userId,
            startDate,
            endDate,
          });
          return createSuccessResponse(result, correlationId);
        }

      case 'POST':
        // Create order
        const createData = validateRequest<any>(event.body, orderCreateSchema);
        const newOrder = await orderService.createOrder(createData);
        return createSuccessResponse(newOrder, correlationId, 201);

      case 'PUT':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'Order ID is required', correlationId);
        }
        // Update order
        const updateData = validateRequest<any>(event.body, orderUpdateSchema);
        const updatedOrder = await orderService.updateOrder(pathParameters.id, updateData);
        return createSuccessResponse(updatedOrder, correlationId);

      case 'DELETE':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'Order ID is required', correlationId);
        }
        // Cancel order
        await orderService.cancelOrder(pathParameters.id);
        return createSuccessResponse({ message: 'Order cancelled successfully' }, correlationId);

      default:
        return createErrorResponse(405, 'Method not allowed', correlationId);
    }
  } catch (error) {
    logger.error('Error processing order request', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });

    if (error instanceof Error) {
      if (error.message.includes('ValidationError')) {
        return createErrorResponse(400, error.message, correlationId);
      }
      if (error.message.includes('ConditionalCheckFailed')) {
        return createErrorResponse(409, 'Order already exists or version conflict', correlationId);
      }
      if (error.message.includes('INVALID_ORDER_STATUS')) {
        return createErrorResponse(400, 'Invalid order status transition', correlationId);
      }
      if (error.message.includes('PAYMENT_FAILED')) {
        return createErrorResponse(402, 'Payment processing failed', correlationId);
      }
    }

    return createErrorResponse(500, 'Internal server error', correlationId);
  }
};

export const handler = middy(orderHandler).use(httpMiddleware());
