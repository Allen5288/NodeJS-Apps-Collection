import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import middy from '@middy/core';
import { logger } from '@/utils/logger';
import { ProductService } from '@/services/product.service';
import { httpMiddleware } from '@/middleware/http.middleware';
import { createErrorResponse, createSuccessResponse } from '@/utils/responses';
import { validateRequest } from '@/utils/validation';
import { productCreateSchema, productUpdateSchema } from '@/validation/product.validation';

const productService = new ProductService();

const productHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, pathParameters, queryStringParameters } = event;
  const correlationId = event.headers['x-correlation-id'] || 'unknown';

  try {
    logger.info('Processing product request', {
      correlationId,
      method: httpMethod,
      path: event.path
    });

    switch (httpMethod) {
      case 'GET':
        if (pathParameters?.id) {
          // Get single product
          const product = await productService.getProductById(pathParameters.id);
          if (!product) {
            return createErrorResponse(404, 'Product not found', correlationId);
          }
          return createSuccessResponse(product, correlationId);
        } else {
          // List products with search and pagination
          const limit = parseInt(queryStringParameters?.limit || '20');
          const lastKey = queryStringParameters?.lastKey;
          const category = queryStringParameters?.category;
          const search = queryStringParameters?.search;
          const inStock = queryStringParameters?.inStock === 'true';
          
          const result = await productService.searchProducts({ 
            lastKey, 
            category, 
            search,
            inStock 
          });
          return createSuccessResponse(result, correlationId);
        }

      case 'POST':
        // Create product
        const createData = validateRequest<any>(event.body, productCreateSchema);
        const newProduct = await productService.createProduct(createData);
        return createSuccessResponse(newProduct, correlationId, 201);

      case 'PUT':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'Product ID is required', correlationId);
        }
        // Update product
        const updateData = validateRequest<any>(event.body, productUpdateSchema);
        const updatedProduct = await productService.updateProduct(pathParameters.id, updateData);
        return createSuccessResponse(updatedProduct, correlationId);

      case 'DELETE':
        if (!pathParameters?.id) {
          return createErrorResponse(400, 'Product ID is required', correlationId);
        }
        // Soft delete product
        await productService.deleteProduct(pathParameters.id);
        return createSuccessResponse({ message: 'Product deleted successfully' }, correlationId);

      default:
        return createErrorResponse(405, 'Method not allowed', correlationId);
    }
  } catch (error) {
    logger.error('Error processing product request', {
      correlationId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    if (error instanceof Error) {
      if (error.message.includes('ValidationError')) {
        return createErrorResponse(400, error.message, correlationId);
      }
      if (error.message.includes('ConditionalCheckFailed')) {
        return createErrorResponse(409, 'Product already exists or version conflict', correlationId);
      }
      if (error.message.includes('INSUFFICIENT_STOCK')) {
        return createErrorResponse(400, 'Insufficient stock available', correlationId);
      }
    }

    return createErrorResponse(500, 'Internal server error', correlationId);
  }
};

export const handler = middy(productHandler).use(httpMiddleware());
