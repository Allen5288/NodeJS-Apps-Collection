import { SQSEvent, SQSRecord } from 'aws-lambda';
import { OrderService } from '@/services/order.service';
import { NotificationService } from '@/services/notification.service';
import { OrderStatus } from '@/models/order.model';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

interface OrderProcessingMessage {
  orderId: string;
  action: 'PROCESS_PAYMENT' | 'FULFILL_ORDER' | 'SEND_CONFIRMATION' | 'UPDATE_INVENTORY';
  metadata?: any;
  correlationId?: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  const orderService = new OrderService();
  const notificationService = new NotificationService();

  for (const record of event.Records) {
    try {
      await processOrderMessage(record, orderService, notificationService);
    } catch (error) {
      logger.error('Failed to process order message', {
        messageId: record.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        body: record.body
      });
      // Don't throw - let other messages process
      // Failed messages will be retried based on SQS configuration
    }
  }
};

async function processOrderMessage(
  record: SQSRecord,
  orderService: OrderService,
  notificationService: NotificationService
): Promise<void> {
  const messageId = record.messageId;
  
  try {
    const message: OrderProcessingMessage = JSON.parse(record.body);
    const { orderId, action, metadata, correlationId } = message;

    logger.info('Processing order message', {
      messageId,
      orderId,
      action,
      correlationId
    });

    switch (action) {
      case 'PROCESS_PAYMENT':
        await processPayment(orderId, orderService, metadata);
        break;

      case 'FULFILL_ORDER':
        await fulfillOrder(orderId, orderService, metadata);
        break;

      case 'SEND_CONFIRMATION':
        await sendOrderConfirmation(orderId, orderService, notificationService);
        break;

      case 'UPDATE_INVENTORY':
        await updateInventoryForOrder(orderId, orderService, metadata);
        break;

      default:
        logger.warn('Unknown order processing action', { action, messageId });
        return;
    }

    logger.info('Order message processed successfully', {
      messageId,
      orderId,
      action
    });

  } catch (error) {
    logger.error('Error processing order message', {
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error; // Re-throw to trigger SQS retry
  }
}

async function processPayment(
  orderId: string,
  orderService: OrderService,
  metadata: any
): Promise<void> {
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Simulate payment processing
    const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

    if (paymentSuccess) {
      await orderService.updateOrderPayment(orderId, {
        status: 'COMPLETED',
        transactionId: `txn_${Date.now()}`,
        processedAt: new Date().toISOString()
      });

      // Queue order fulfillment
      await orderService.queueOrderAction(orderId, 'FULFILL_ORDER');
    } else {
      await orderService.updateOrderPayment(orderId, {
        status: 'FAILED',
        failureReason: 'Payment declined by processor'
      });

      // Cancel the order
      await orderService.cancelOrder(orderId, 'PAYMENT_FAILED', 'system');
    }
  } catch (error) {
    logger.error('Payment processing failed', {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function fulfillOrder(
  orderId: string,
  orderService: OrderService,
  metadata: any
): Promise<void> {
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Update order status to processing
    await orderService.updateOrderStatus(orderId, OrderStatus.PROCESSING);

    // Simulate fulfillment processing
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update fulfillment details
    await orderService.updateOrderFulfillment(orderId, {
      status: 'PROCESSING',
      notes: 'Order items are being prepared for shipment'
    });

    // For demo, immediately mark as shipped
    setTimeout(async () => {
      try {
        await orderService.updateOrderFulfillment(orderId, {
          status: 'SHIPPED',
          shippedAt: new Date().toISOString()
        });

        await orderService.updateOrderStatus(orderId, OrderStatus.SHIPPED);

        // Queue confirmation notification
        await orderService.queueOrderAction(orderId, 'SEND_CONFIRMATION');
      } catch (error) {
        logger.error('Failed to update shipping status', {
          orderId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }, 5000);

  } catch (error) {
    logger.error('Order fulfillment failed', {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function sendOrderConfirmation(
  orderId: string,
  orderService: OrderService,
  notificationService: NotificationService
): Promise<void> {
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    await notificationService.sendOrderConfirmation(order);

    logger.info('Order confirmation sent', { orderId });
  } catch (error) {
    logger.error('Failed to send order confirmation', {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

async function updateInventoryForOrder(
  orderId: string,
  orderService: OrderService,
  metadata: any
): Promise<void> {
  try {
    const order = await orderService.getOrderById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Update inventory for each order item
    for (const item of order.items) {
      await orderService.updateProductInventory(item.productId, {
        quantity: -item.quantity,
        operation: 'ADD', // Negative quantity for subtract
        reason: `Order fulfillment: ${orderId}`
      });
    }

    logger.info('Inventory updated for order', { orderId });
  } catch (error) {
    logger.error('Failed to update inventory for order', {
      orderId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}
