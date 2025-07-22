import { BaseRepository, QueryResult } from './base.repository';
import { Order, OrderSearchCriteria, OrderStatus, PaymentStatus } from '@/models/order.model';
import { config } from '@/utils/config';

export class OrderRepository extends BaseRepository<Order> {
  constructor() {
    super(config.aws.dynamodb.ordersTable);
  }

  async findByUserId(userId: string, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Order>> {
    try {
      return await this.query(
        'UserIndex',
        { userId },
        undefined,
        {
          ...options,
          sortOrder: 'DESC' // Most recent first
        }
      );
    } catch (error) {
      this.logger.error('Failed to find orders by user ID', error as Error, { userId });
      throw error;
    }
  }

  async findByStatus(status: OrderStatus, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Order>> {
    try {
      return await this.query(
        'StatusIndex',
        { status },
        undefined,
        {
          ...options,
          sortOrder: 'DESC' // Most recent first
        }
      );
    } catch (error) {
      this.logger.error('Failed to find orders by status', error as Error, { status });
      throw error;
    }
  }

  async searchOrders(criteria: OrderSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<Order>> {
    try {
      // If searching by userId only, use the user index
      if (criteria.userId && !Object.keys(criteria).some(key => key !== 'userId')) {
        return await this.query(
          'UserIndex',
          { userId: criteria.userId },
          undefined,
          { ...options, sortOrder: 'DESC' }
        );
      }

      // If searching by status only, use the status index
      if (criteria.status && !Object.keys(criteria).some(key => key !== 'status')) {
        return await this.query(
          'StatusIndex',
          { status: criteria.status },
          undefined,
          { ...options, sortOrder: 'DESC' }
        );
      }

      // For complex criteria, use scan with filters
      const attributeNames: Record<string, string> = {};
      const attributeValues: Record<string, any> = {};
      const filterExpressions: string[] = [];

      if (criteria.userId) {
        filterExpressions.push('userId = :userId');
        attributeValues[':userId'] = criteria.userId;
      }

      if (criteria.status) {
        filterExpressions.push('#status = :status');
        attributeNames['#status'] = 'status';
        attributeValues[':status'] = criteria.status;
      }

      if (criteria.paymentStatus) {
        filterExpressions.push('payment.#paymentStatus = :paymentStatus');
        attributeNames['#paymentStatus'] = 'status';
        attributeValues[':paymentStatus'] = criteria.paymentStatus;
      }

      if (criteria.createdAfter) {
        filterExpressions.push('#createdAt >= :createdAfter');
        attributeNames['#createdAt'] = 'createdAt';
        attributeValues[':createdAfter'] = criteria.createdAfter;
      }

      if (criteria.createdBefore) {
        filterExpressions.push('#createdAt <= :createdBefore');
        attributeNames['#createdAt'] = 'createdAt';
        attributeValues[':createdBefore'] = criteria.createdBefore;
      }

      if (criteria.totalMin !== undefined) {
        filterExpressions.push('totals.total >= :totalMin');
        attributeValues[':totalMin'] = criteria.totalMin;
      }

      if (criteria.totalMax !== undefined) {
        filterExpressions.push('totals.total <= :totalMax');
        attributeValues[':totalMax'] = criteria.totalMax;
      }

      const filterExpression = filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined;

      return await this.scan(
        filterExpression,
        Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
        options
      );
    } catch (error) {
      this.logger.error('Failed to search orders', error as Error, { criteria });
      throw error;
    }
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    return await this.update(id, { status });
  }

  async updatePaymentStatus(id: string, paymentStatus: PaymentStatus, transactionId?: string): Promise<Order> {
    const existing = await this.findByIdOrThrow(id);
    const updatedPayment = {
      ...existing.payment,
      status: paymentStatus,
      ...(transactionId && { transactionId }),
      processedAt: new Date().toISOString()
    };

    return await this.update(id, { payment: updatedPayment });
  }

  async addTrackingInfo(id: string, carrier: string, trackingNumber: string, trackingUrl?: string): Promise<Order> {
    const tracking = {
      carrier,
      trackingNumber,
      trackingUrl,
      status: 'IN_TRANSIT',
      estimatedDelivery: undefined
    };

    return await this.update(id, { tracking });
  }

  async updateShippingInfo(id: string, estimatedDelivery?: string, actualDelivery?: string): Promise<Order> {
    const existing = await this.findByIdOrThrow(id);
    const updatedShipping = {
      ...existing.shipping,
      ...(estimatedDelivery && { estimatedDelivery }),
      ...(actualDelivery && { actualDelivery })
    };

    return await this.update(id, { shipping: updatedShipping });
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    try {
      const result = await this.scan(
        '#createdAt BETWEEN :startDate AND :endDate',
        {
          ':startDate': startDate,
          ':endDate': endDate
        }
      );
      
      return result.items;
    } catch (error) {
      this.logger.error('Failed to get orders by date range', error as Error, { startDate, endDate });
      throw error;
    }
  }

  async getOrdersRequiringAction(): Promise<Order[]> {
    try {
      const actionableStatuses = [OrderStatus.PENDING, OrderStatus.CONFIRMED];
      const allOrders: Order[] = [];

      for (const status of actionableStatuses) {
        const result = await this.query(
          'StatusIndex',
          { status }
        );
        allOrders.push(...result.items);
      }

      return allOrders;
    } catch (error) {
      this.logger.error('Failed to get orders requiring action', error as Error);
      throw error;
    }
  }

  async getOrderStatsByStatus(): Promise<Record<OrderStatus, number>> {
    try {
      const result = await this.scan();
      const stats: Record<OrderStatus, number> = {} as Record<OrderStatus, number>;

      // Initialize all statuses with 0
      Object.values(OrderStatus).forEach(status => {
        stats[status] = 0;
      });

      result.items.forEach(order => {
        stats[order.status]++;
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get order stats by status', error as Error);
      throw error;
    }
  }

  async getRevenueByDateRange(startDate: string, endDate: string): Promise<{ total: number; currency: string; orderCount: number }> {
    try {
      const orders = await this.getOrdersByDateRange(startDate, endDate);
      
      const completedOrders = orders.filter(order => 
        order.status === OrderStatus.DELIVERED && 
        order.payment.status === PaymentStatus.CAPTURED
      );

      const total = completedOrders.reduce((sum, order) => sum + order.totals.total, 0);
      const currency = completedOrders.length > 0 ? completedOrders[0].totals.currency : 'USD';

      return {
        total,
        currency,
        orderCount: completedOrders.length
      };
    } catch (error) {
      this.logger.error('Failed to get revenue by date range', error as Error, { startDate, endDate });
      throw error;
    }
  }

  async getTopCustomersByOrderValue(limit: number = 10): Promise<Array<{ userId: string; totalValue: number; orderCount: number }>> {
    try {
      const result = await this.scan();
      const customerStats: Record<string, { totalValue: number; orderCount: number }> = {};

      result.items
        .filter(order => order.payment.status === PaymentStatus.CAPTURED)
        .forEach(order => {
          if (!customerStats[order.userId]) {
            customerStats[order.userId] = { totalValue: 0, orderCount: 0 };
          }
          customerStats[order.userId].totalValue += order.totals.total;
          customerStats[order.userId].orderCount++;
        });

      return Object.entries(customerStats)
        .map(([userId, stats]) => ({ userId, ...stats }))
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, limit);
    } catch (error) {
      this.logger.error('Failed to get top customers by order value', error as Error, { limit });
      throw error;
    }
  }

  async findPendingOrdersOlderThan(hours: number): Promise<Order[]> {
    try {
      const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
      
      const result = await this.query(
        'StatusIndex',
        { status: OrderStatus.PENDING }
      );

      return result.items.filter(order => order.createdAt < cutoffTime);
    } catch (error) {
      this.logger.error('Failed to find pending orders older than specified hours', error as Error, { hours });
      throw error;
    }
  }

  async getAverageOrderValue(startDate?: string, endDate?: string): Promise<{ average: number; currency: string; sampleSize: number }> {
    try {
      let orders: Order[];
      
      if (startDate && endDate) {
        orders = await this.getOrdersByDateRange(startDate, endDate);
      } else {
        const result = await this.scan();
        orders = result.items;
      }

      const completedOrders = orders.filter(order => 
        order.status === OrderStatus.DELIVERED && 
        order.payment.status === PaymentStatus.CAPTURED
      );

      if (completedOrders.length === 0) {
        return { average: 0, currency: 'USD', sampleSize: 0 };
      }

      const total = completedOrders.reduce((sum, order) => sum + order.totals.total, 0);
      const average = total / completedOrders.length;
      const currency = completedOrders[0].totals.currency;

      return {
        average: Math.round(average * 100) / 100, // Round to 2 decimal places
        currency,
        sampleSize: completedOrders.length
      };
    } catch (error) {
      this.logger.error('Failed to get average order value', error as Error, { startDate, endDate });
      throw error;
    }
  }
}
