import { SQSEvent, SQSRecord } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { config } from '@/utils/config';

interface NotificationMessage {
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  template: string;
  variables: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  timestamp: string;
  correlationId?: string;
}

export const handler = async (event: SQSEvent): Promise<void> => {
  for (const record of event.Records) {
    try {
      await processNotificationMessage(record);
    } catch (error) {
      logger.error('Failed to process notification message', {
        messageId: record.messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
        body: record.body
      });
      // Don't throw - let other messages process
    }
  }
};

async function processNotificationMessage(record: SQSRecord): Promise<void> {
  const messageId = record.messageId;
  
  try {
    const message: NotificationMessage = JSON.parse(record.body);
    const { userId, type, template, variables, priority, correlationId } = message;

    logger.info('Processing notification message', {
      messageId,
      userId,
      type,
      template,
      priority,
      correlationId
    });

    switch (type) {
      case 'EMAIL':
        await sendEmailNotification(userId, template, variables);
        break;

      case 'SMS':
        await sendSmsNotification(userId, template, variables);
        break;

      case 'PUSH':
        await sendPushNotification(userId, template, variables);
        break;

      default:
        logger.warn('Unknown notification type', { type, messageId });
        return;
    }

    logger.info('Notification sent successfully', {
      messageId,
      userId,
      type,
      template
    });

  } catch (error) {
    logger.error('Error processing notification message', {
      messageId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

async function sendEmailNotification(
  userId: string,
  template: string,
  variables: Record<string, any>
): Promise<void> {
  // Email sending implementation would go here
  // For demo purposes, we'll just log it
  logger.info('Email notification sent', {
    userId,
    template,
    to: variables.userEmail || 'user@example.com',
    subject: getEmailSubject(template, variables)
  });

  // In a real implementation, you would:
  // 1. Get user details from database
  // 2. Load email template from storage
  // 3. Render template with variables
  // 4. Send via SES, SendGrid, etc.
  
  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 100));
}

async function sendSmsNotification(
  userId: string,
  template: string,
  variables: Record<string, any>
): Promise<void> {
  // SMS sending implementation would go here
  logger.info('SMS notification sent', {
    userId,
    template,
    message: getSmsMessage(template, variables)
  });

  // In a real implementation, you would:
  // 1. Get user phone number from database
  // 2. Load SMS template
  // 3. Render template with variables
  // 4. Send via SNS SMS, Twilio, etc.
  
  await new Promise(resolve => setTimeout(resolve, 50));
}

async function sendPushNotification(
  userId: string,
  template: string,
  variables: Record<string, any>
): Promise<void> {
  // Push notification implementation would go here
  logger.info('Push notification sent', {
    userId,
    template,
    title: getPushTitle(template, variables),
    body: getPushBody(template, variables)
  });

  // In a real implementation, you would:
  // 1. Get user device tokens from database
  // 2. Load push notification template
  // 3. Render template with variables
  // 4. Send via FCM, APNS, etc.
  
  await new Promise(resolve => setTimeout(resolve, 30));
}

function getEmailSubject(template: string, variables: Record<string, any>): string {
  const subjects: Record<string, string> = {
    'user_welcome': `Welcome to ${config.app.serviceName}!`,
    'order_confirmation': `Order Confirmation - ${variables.orderId}`,
    'order_status_update': `Order Update - ${variables.orderId}`,
    'password_reset': 'Password Reset Request',
    'inventory_alert': `Low Inventory Alert - ${variables.productId}`
  };

  return subjects[template] || 'Notification';
}

function getSmsMessage(template: string, variables: Record<string, any>): string {
  const messages: Record<string, string> = {
    'order_confirmation_sms': `Your order ${variables.orderId} has been confirmed. Total: ${variables.currency} ${variables.orderTotal}`,
    'order_shipped_sms': `Your order ${variables.orderId} has been shipped. Track: ${variables.trackingNumber}`,
    'password_reset_sms': `Your password reset code: ${variables.resetCode}. Valid for 10 minutes.`
  };

  return messages[template] || 'Notification';
}

function getPushTitle(template: string, variables: Record<string, any>): string {
  const titles: Record<string, string> = {
    'order_confirmation': 'Order Confirmed',
    'order_shipped': 'Order Shipped',
    'order_delivered': 'Order Delivered',
    'user_welcome': 'Welcome!'
  };

  return titles[template] || 'Notification';
}

function getPushBody(template: string, variables: Record<string, any>): string {
  const bodies: Record<string, string> = {
    'order_confirmation': `Your order ${variables.orderId} has been confirmed`,
    'order_shipped': `Your order ${variables.orderId} is on its way`,
    'order_delivered': `Your order ${variables.orderId} has been delivered`,
    'user_welcome': `Welcome to ${config.app.serviceName}!`
  };

  return bodies[template] || 'You have a new notification';
}
