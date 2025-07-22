import { DynamoDBStreamEvent, DynamoDBRecord } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { NotificationService } from '@/services/notification.service';
import { AuditService } from '@/services/audit.service';

export const handler = async (event: DynamoDBStreamEvent): Promise<void> => {
  const notificationService = new NotificationService();
  const auditService = new AuditService();

  for (const record of event.Records) {
    try {
      await processStreamRecord(record, notificationService, auditService);
    } catch (error) {
      logger.error('Failed to process stream record', {
        eventName: record.eventName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      // Don't throw - let other records process
    }
  }
};

async function processStreamRecord(
  record: DynamoDBRecord,
  notificationService: NotificationService,
  auditService: AuditService
): Promise<void> {
  const { eventName, dynamodb } = record;
  
  if (!dynamodb || !eventName) {
    return;
  }

  logger.info('Processing DynamoDB stream record', {
    eventName,
    tableName: record.eventSourceARN?.split('/')[1]
  });

  try {
    // Process based on table and event type
    const tableName = record.eventSourceARN?.split('/')[1];

    switch (tableName) {
      case process.env.USERS_TABLE?.split('-').pop():
        await processUserEvent(record, notificationService);
        break;

      case process.env.ORDERS_TABLE?.split('-').pop():
        await processOrderEvent(record, notificationService);
        break;

      case process.env.PRODUCTS_TABLE?.split('-').pop():
        await processProductEvent(record, notificationService);
        break;

      default:
        logger.debug('Unhandled table in stream', { tableName });
    }

    // Create audit log for all changes
    await createAuditLogFromStream(record, auditService);

  } catch (error) {
    logger.error('Error processing stream record', {
      eventName,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function processUserEvent(
  record: DynamoDBRecord,
  notificationService: NotificationService
): Promise<void> {
  const { eventName, dynamodb } = record;

  if (eventName === 'INSERT' && dynamodb?.NewImage) {
    // New user created - send welcome notification
    const user = unmarshallDynamoDBItem(dynamodb.NewImage);
    
    if (user.status === 'ACTIVE') {
      await notificationService.sendUserWelcome(user);
      logger.info('Welcome notification queued for new user', { userId: user.id });
    }
  }
}

async function processOrderEvent(
  record: DynamoDBRecord,
  notificationService: NotificationService
): Promise<void> {
  const { eventName, dynamodb } = record;

  if (eventName === 'INSERT' && dynamodb?.NewImage) {
    // New order created
    const order = unmarshallDynamoDBItem(dynamodb.NewImage);
    await notificationService.sendOrderConfirmation(order);
    logger.info('Order confirmation queued', { orderId: order.id });

  } else if (eventName === 'MODIFY' && dynamodb?.NewImage && dynamodb?.OldImage) {
    // Order updated - check for status changes
    const newOrder = unmarshallDynamoDBItem(dynamodb.NewImage);
    const oldOrder = unmarshallDynamoDBItem(dynamodb.OldImage);

    if (newOrder.status !== oldOrder.status) {
      await notificationService.sendOrderStatusUpdate(newOrder, oldOrder.status);
      logger.info('Order status update notification queued', {
        orderId: newOrder.id,
        oldStatus: oldOrder.status,
        newStatus: newOrder.status
      });
    }
  }
}

async function processProductEvent(
  record: DynamoDBRecord,
  notificationService: NotificationService
): Promise<void> {
  const { eventName, dynamodb } = record;

  if ((eventName === 'INSERT' || eventName === 'MODIFY') && dynamodb?.NewImage) {
    const product = unmarshallDynamoDBItem(dynamodb.NewImage);
    
    // Check for low inventory
    if (product.inventory?.trackInventory && 
        product.inventory.quantity <= product.inventory.lowStockThreshold) {
      
      await notificationService.sendInventoryAlert(
        product.id,
        product.inventory.quantity,
        product.inventory.lowStockThreshold
      );
      
      logger.info('Low inventory alert sent', {
        productId: product.id,
        currentStock: product.inventory.quantity,
        threshold: product.inventory.lowStockThreshold
      });
    }
  }
}

async function createAuditLogFromStream(
  record: DynamoDBRecord,
  auditService: AuditService
): Promise<void> {
  const { eventName, dynamodb } = record;
  
  if (!dynamodb?.Keys) {
    return;
  }

  const entityId = unmarshallDynamoDBItem(dynamodb.Keys).id;
  const tableName = record.eventSourceARN?.split('/')[1];
  
  let entityType = 'Unknown';
  let action = 'UNKNOWN';

  // Map table name to entity type
  if (tableName?.includes('users')) entityType = 'User';
  else if (tableName?.includes('orders')) entityType = 'Order';
  else if (tableName?.includes('products')) entityType = 'Product';

  // Map event name to action
  switch (eventName) {
    case 'INSERT':
      action = 'CREATE';
      break;
    case 'MODIFY':
      action = 'UPDATE';
      break;
    case 'REMOVE':
      action = 'DELETE';
      break;
  }

  try {
    await auditService.createAuditLog(
      entityType,
      entityId,
      action as any,
      {
        source: 'DynamoDB Stream',
        eventName,
        tableName,
        timestamp: new Date().toISOString()
      }
    );
  } catch (error) {
    logger.error('Failed to create audit log from stream', {
      entityType,
      entityId,
      action,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

function unmarshallDynamoDBItem(item: any): any {
  // Simple unmarshalling function
  // In production, you'd use @aws-sdk/util-dynamodb
  const result: any = {};
  
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === 'object' && value !== null) {
      const type = Object.keys(value as object)[0];
      const val = (value as any)[type];
      
      switch (type) {
        case 'S':
          result[key] = val;
          break;
        case 'N':
          result[key] = Number(val);
          break;
        case 'B':
          result[key] = Boolean(val);
          break;
        case 'SS':
          result[key] = val;
          break;
        case 'NS':
          result[key] = val.map(Number);
          break;
        case 'M':
          result[key] = unmarshallDynamoDBItem(val);
          break;
        case 'L':
          result[key] = val.map((item: any) => 
            typeof item === 'object' ? unmarshallDynamoDBItem({ temp: item }).temp : item
          );
          break;
        default:
          result[key] = val;
      }
    }
  }
  
  return result;
}
