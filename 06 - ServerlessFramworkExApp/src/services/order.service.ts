import { BaseService } from './base.service';
import { OrderRepository } from '@/repositories/order.repository';
import { UserRepository } from '@/repositories/user.repository';
import { ProductRepository } from '@/repositories/product.repository';
import { 
  Order, 
  CreateOrderRequest, 
  UpdateOrderRequest, 
  OrderSearchCriteria, 
  PaginatedOrders,
  OrderStatus,
  PaymentStatus
} from '@/models/order.model';
import { AuditAction } from '@/models/audit.model';

export class OrderService extends BaseService {
  private readonly orderRepository: OrderRepository;
  private readonly userRepository: UserRepository;
  private readonly productRepository: ProductRepository;

  constructor(correlationId?: string, userId?: string) {
    super(correlationId, userId);
    this.orderRepository = new OrderRepository();
    this.userRepository = new UserRepository();
    this.productRepository = new ProductRepository();
  }

  async createOrder(request: CreateOrderRequest, createdBy?: string): Promise<Order> {
    this.logger.info('Creating order', { userId: request.userId, itemCount: request.items.length });

    // Validate user exists
    const user = await this.userRepository.findById(request.userId);
    await this.validateExistence(user, 'User', request.userId);

    // Validate business rules
    this.validateBusinessRules([
      {
        condition: request.items.length > 0,
        message: 'Order must contain at least one item',
        code: 'EMPTY_ORDER'
      },
      {
        condition: request.items.length <= 50,
        message: 'Order cannot contain more than 50 items',
        code: 'TOO_MANY_ITEMS'
      }
    ]);

    // Validate products and calculate totals
    const validatedItems = await this.validateAndEnrichOrderItems(request.items);
    const totals = this.calculateOrderTotals(validatedItems);

    const orderToCreate = {
      ...request,
      items: validatedItems,
      totals,
      status: OrderStatus.PENDING,
      payment: {
        ...request.payment,
        status: PaymentStatus.PENDING
      },
      metadata: {
        source: 'api',
        customerNotes: request.metadata?.customerNotes,
        promotionCodes: request.metadata?.promotionCodes || [],
        referralCode: request.metadata?.referralCode
      }
    };

    const order = await this.withRetry(() => 
      this.orderRepository.create(orderToCreate)
    );

    await this.createAuditLog(
      'Order',
      order.id,
      AuditAction.CREATE,
      this.buildChangeSet(null, this.sanitizeForAudit(order)),
      createdBy
    );

    this.logger.info('Order created successfully', { 
      orderId: order.id, 
      userId: order.userId,
      total: order.totals.total
    });

    return order;
  }

  async getOrderById(id: string): Promise<Order> {
    this.logger.info('Getting order by ID', { orderId: id });
    
    const order = await this.orderRepository.findById(id);
    return await this.validateExistence(order, 'Order', id);
  }

  async updateOrder(id: string, request: UpdateOrderRequest, updatedBy?: string): Promise<Order> {
    this.logger.info('Updating order', { orderId: id });

    const existingOrder = await this.getOrderById(id);
    
    // Merge metadata properly to ensure required fields are present
    const updateData = {
      ...request,
      metadata: request.metadata ? {
        ...existingOrder.metadata,
        ...request.metadata
      } : existingOrder.metadata,
      shipping: request.shipping ? {
        ...existingOrder.shipping,
        ...request.shipping
      } : existingOrder.shipping,
      payment: request.payment ? {
        ...existingOrder.payment,
        ...request.payment
      } : existingOrder.payment
    };
    
    const updatedOrder = await this.withRetry(() =>
      this.orderRepository.update(id, updateData)
    );

    await this.createAuditLog(
      'Order',
      id,
      AuditAction.UPDATE,
      this.buildChangeSet(this.sanitizeForAudit(existingOrder), this.sanitizeForAudit(updatedOrder)),
      updatedBy
    );

    return updatedOrder;
  }

  async cancelOrder(id: string, reason?: string, cancelledBy?: string): Promise<Order> {
    this.logger.info('Cancelling order', { orderId: id, reason });

    const existingOrder = await this.getOrderById(id);

    // Validate order can be cancelled
    this.validateBusinessRules([
      {
        condition: [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(existingOrder.status),
        message: 'Order cannot be cancelled in current status',
        code: 'INVALID_CANCEL_STATUS'
      }
    ]);

    const updatedOrder = await this.orderRepository.updateStatus(id, OrderStatus.CANCELLED);

    await this.createAuditLog(
      'Order',
      id,
      AuditAction.UPDATE,
      { action: 'cancelled', reason },
      cancelledBy
    );

    return updatedOrder;
  }

  async shipOrder(id: string, trackingInfo: any, shippedBy?: string): Promise<Order> {
    this.logger.info('Shipping order', { orderId: id });

    const existingOrder = await this.getOrderById(id);

    // Validate order can be shipped
    this.validateBusinessRules([
      {
        condition: existingOrder.status === OrderStatus.CONFIRMED,
        message: 'Order must be confirmed before shipping',
        code: 'INVALID_SHIP_STATUS'
      }
    ]);

    // Update order status and add tracking
    const updatedOrder = await this.orderRepository.updateStatus(id, OrderStatus.SHIPPED);
    
    if (trackingInfo) {
      await this.orderRepository.addTrackingInfo(
        id, 
        trackingInfo.carrier, 
        trackingInfo.trackingNumber, 
        trackingInfo.trackingUrl
      );
    }

    await this.createAuditLog(
      'Order',
      id,
      AuditAction.UPDATE,
      { action: 'shipped', trackingInfo },
      shippedBy
    );

    return updatedOrder;
  }

  async searchOrders(criteria: OrderSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<PaginatedOrders> {
    this.logger.info('Searching orders', { criteria });

    const limit = Math.min(options.limit || 20, 100);

    const result = await this.orderRepository.searchOrders(criteria, {
      ...options,
      limit
    });

    return {
      orders: result.items,
      nextToken: result.nextToken,
      totalCount: result.totalCount
    };
  }

  private async validateAndEnrichOrderItems(items: any[]): Promise<any[]> {
    const enrichedItems = [];

    for (const item of items) {
      const product = await this.productRepository.findById(item.productId);
      await this.validateExistence(product, 'Product', item.productId);

      // Validate inventory
      this.validateBusinessRules([
        {
          condition: product!.inventory.available >= item.quantity,
          message: `Insufficient inventory for product ${product!.name}`,
          code: 'INSUFFICIENT_INVENTORY'
        }
      ]);

      enrichedItems.push({
        ...item,
        productName: product!.name,
        productSku: product!.sku,
        totalPrice: item.quantity * item.unitPrice
      });
    }

    return enrichedItems;
  }

  private calculateOrderTotals(items: any[]): any {
    const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const tax = subtotal * 0.085; // 8.5% tax rate
    const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
    const discount = 0; // No discounts for now
    const total = subtotal + tax + shipping - discount;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      shipping: Math.round(shipping * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      total: Math.round(total * 100) / 100,
      currency: 'USD'
    };
  }

  async updateOrderPayment(orderId: string, paymentInfo: any): Promise<Order> {
    this.logger.info('Updating order payment', { orderId });
    
    const existingOrder = await this.getOrderById(orderId);
    
    const updatedOrder = await this.orderRepository.update(orderId, {
      payment: {
        ...existingOrder.payment,
        ...paymentInfo
      }
    });

    await this.createAuditLog(
      'Order',
      orderId,
      AuditAction.UPDATE,
      { action: 'payment_updated', paymentInfo }
    );

    return updatedOrder;
  }

  async queueOrderAction(orderId: string, action: string): Promise<void> {
    this.logger.info('Queueing order action', { orderId, action });
    
    // In a real implementation, this would send to SQS or EventBridge
    // For now, just log the action
    this.logger.info('Order action queued', { orderId, action });
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    this.logger.info('Updating order status', { orderId, status });
    
    const updatedOrder = await this.orderRepository.updateStatus(orderId, status);
    
    await this.createAuditLog(
      'Order',
      orderId,
      AuditAction.UPDATE,
      { action: 'status_updated', newStatus: status }
    );

    return updatedOrder;
  }

  async updateOrderFulfillment(orderId: string, fulfillmentInfo: any): Promise<Order> {
    this.logger.info('Updating order fulfillment', { orderId });
    
    const existingOrder = await this.getOrderById(orderId);
    
    const updatedOrder = await this.orderRepository.update(orderId, {
      tracking: {
        ...existingOrder.tracking,
        ...fulfillmentInfo
      }
    });

    await this.createAuditLog(
      'Order',
      orderId,
      AuditAction.UPDATE,
      { action: 'fulfillment_updated', fulfillmentInfo }
    );

    return updatedOrder;
  }

  async updateProductInventory(productId: string, inventoryUpdate: any): Promise<void> {
    this.logger.info('Updating product inventory', { productId, inventoryUpdate });
    
    // This would typically call ProductService, but for now just log
    this.logger.info('Product inventory update queued', { productId, inventoryUpdate });
  }
}
