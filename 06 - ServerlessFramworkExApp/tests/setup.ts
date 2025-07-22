// Global test setup
import * as dotenv from 'dotenv';

// Load test environment
dotenv.config({ path: '.env.test' });

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.STAGE = 'test';
process.env.REGION = 'us-east-1';
process.env.SERVICE_NAME = 'test-service';
process.env.LOG_LEVEL = 'error';

process.env.USERS_TABLE = 'test-users';
process.env.PRODUCTS_TABLE = 'test-products';
process.env.ORDERS_TABLE = 'test-orders';
process.env.AUDIT_TABLE = 'test-audit';

process.env.ORDER_PROCESSING_QUEUE = 'test-order-queue';
process.env.NOTIFICATION_QUEUE = 'test-notification-queue';

process.env.ORDER_EVENTS_TOPIC = 'test-order-events';
process.env.USER_EVENTS_TOPIC = 'test-user-events';
process.env.INVENTORY_ALERTS_TOPIC = 'test-inventory-alerts';

process.env.USER_POOL_ID = 'test-pool';
process.env.USER_POOL_CLIENT_ID = 'test-client';
process.env.UPLOADS_BUCKET = 'test-uploads';

process.env.JWT_SECRET = 'test-secret';
process.env.CORRELATION_ID_HEADER = 'x-correlation-id';
process.env.FRONTEND_URL = 'https://test.example.com';

// Set up global test timeout
jest.setTimeout(30000);
