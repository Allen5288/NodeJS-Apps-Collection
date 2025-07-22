import { BaseService } from './base.service';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { Order } from '@/models/order.model';
import { User } from '@/models/user.model';
import { config } from '@/utils/config';

export interface NotificationTemplate {
  id: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  subject?: string;
  template: string;
  variables: Record<string, any>;
}

export interface NotificationRequest {
  userId: string;
  type: 'EMAIL' | 'SMS' | 'PUSH';
  template: string;
  variables: Record<string, any>;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  scheduleAt?: string;
}

export class NotificationService extends BaseService {
  private readonly snsClient: SNSClient;
  private readonly sqsClient: SQSClient;

  constructor(correlationId?: string, userId?: string) {
    super(correlationId, userId);
    this.snsClient = new SNSClient({ region: config.aws.region });
    this.sqsClient = new SQSClient({ region: config.aws.region });
  }

  async sendOrderConfirmation(order: Order): Promise<void> {
    this.logger.info('Sending order confirmation', { orderId: order.id });

    try {
      const notification: NotificationRequest = {
        userId: order.userId,
        type: 'EMAIL',
        template: 'order_confirmation',
        variables: {
          orderId: order.id,
          orderTotal: order.totals.total,
          currency: order.totals.currency,
          items: order.items,
          shippingAddress: order.shipping.address,
          expectedDelivery: order.tracking?.estimatedDelivery || 'TBD'
        },
        priority: 'HIGH'
      };

      await this.queueNotification(notification);

      // Also send SMS if user has phone number and opted in
      // const user = await this.getUserById(order.userId);
      // if (user?.profile?.phoneNumber && user.profile.preferences.smsNotifications) {
      //   await this.sendSmsNotification(user, 'order_confirmation_sms', notification.variables);
      // }

    } catch (error) {
      this.logger.error('Failed to send order confirmation', error instanceof Error ? error : undefined, {
        orderId: order.id
      });
      throw error;
    }
  }

  async sendOrderStatusUpdate(order: Order, previousStatus: string): Promise<void> {
    this.logger.info('Sending order status update', { 
      orderId: order.id, 
      status: order.status,
      previousStatus 
    });

    try {
      const notification: NotificationRequest = {
        userId: order.userId,
        type: 'EMAIL',
        template: 'order_status_update',
        variables: {
          orderId: order.id,
          status: order.status,
          previousStatus,
          tracking: order.tracking,
          orderUrl: `${config.app.frontendUrl}/orders/${order.id}`
        },
        priority: 'NORMAL'
      };

      await this.queueNotification(notification);

    } catch (error) {
      this.logger.error('Failed to send order status update', error instanceof Error ? error : undefined, {
        orderId: order.id
      });
      throw error;
    }
  }

  async sendUserWelcome(user: User): Promise<void> {
    this.logger.info('Sending welcome notification', { userId: user.id });

    try {
      const notification: NotificationRequest = {
        userId: user.id,
        type: 'EMAIL',
        template: 'user_welcome',
        variables: {
          userName: user.name,
          userEmail: user.email,
          profileUrl: `${config.app.frontendUrl}/profile`,
          supportUrl: `${config.app.frontendUrl}/support`
        },
        priority: 'NORMAL'
      };

      await this.queueNotification(notification);

    } catch (error) {
      this.logger.error('Failed to send welcome notification', error instanceof Error ? error : undefined, {
        userId: user.id
      });
      throw error;
    }
  }

  async sendPasswordReset(user: User, resetToken: string): Promise<void> {
    this.logger.info('Sending password reset notification', { userId: user.id });

    try {
      const notification: NotificationRequest = {
        userId: user.id,
        type: 'EMAIL',
        template: 'password_reset',
        variables: {
          userName: user.name,
          resetUrl: `${config.app.frontendUrl}/reset-password?token=${resetToken}`,
          expiresIn: '24 hours'
        },
        priority: 'HIGH'
      };

      await this.queueNotification(notification);

    } catch (error) {
      this.logger.error('Failed to send password reset notification', error instanceof Error ? error : undefined, {
        userId: user.id
      });
      throw error;
    }
  }

  async sendInventoryAlert(productId: string, currentStock: number, threshold: number): Promise<void> {
    this.logger.info('Sending inventory alert', { productId, currentStock, threshold });

    try {
      // Publish to SNS topic for admin notifications
      const message = {
        type: 'INVENTORY_ALERT',
        productId,
        currentStock,
        threshold,
        timestamp: new Date().toISOString()
      };

      const command = new PublishCommand({
        TopicArn: config.aws.sns.inventoryAlertsTopic,
        Message: JSON.stringify(message),
        Subject: `Low Inventory Alert - Product ${productId}`,
        MessageAttributes: {
          'alertType': {
            DataType: 'String',
            StringValue: 'INVENTORY_LOW'
          },
          'priority': {
            DataType: 'String',
            StringValue: 'HIGH'
          }
        }
      });

      await this.snsClient.send(command);

    } catch (error) {
      this.logger.error('Failed to send inventory alert', error instanceof Error ? error : undefined, {
        productId
      });
      throw error;
    }
  }

  private async queueNotification(notification: NotificationRequest): Promise<void> {
    try {
      const message = {
        ...notification,
        timestamp: new Date().toISOString()
      };

      const command = new SendMessageCommand({
        QueueUrl: config.aws.sqs.notificationQueue,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          'notificationType': {
            DataType: 'String',
            StringValue: notification.type
          },
          'priority': {
            DataType: 'String',
            StringValue: notification.priority
          }
        },
        DelaySeconds: notification.scheduleAt ? 
          Math.max(0, Math.floor((new Date(notification.scheduleAt).getTime() - Date.now()) / 1000)) : 
          0
      });

      await this.sqsClient.send(command);

      this.logger.info('Notification queued successfully', {
        userId: notification.userId,
        type: notification.type,
        template: notification.template
      });

    } catch (error) {
      this.logger.error('Failed to queue notification', error instanceof Error ? error : undefined, {
        notificationType: notification.type
      });
      throw error;
    }
  }

  private async sendSmsNotification(user: User, template: string, variables: Record<string, any>): Promise<void> {
    // SMS notification implementation would go here
    // For now, just queue it like other notifications
    const notification: NotificationRequest = {
      userId: user.id,
      type: 'SMS',
      template,
      variables,
      priority: 'NORMAL'
    };

    await this.queueNotification(notification);
  }
}
