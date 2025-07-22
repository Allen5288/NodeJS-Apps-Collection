import { BaseRepository, QueryResult } from './base.repository';
import { AuditLog, AuditSearchCriteria, AuditAction } from '@/models/audit.model';
import { config } from '@/utils/config';

export class AuditRepository extends BaseRepository<AuditLog> {
  constructor() {
    super(config.aws.dynamodb.auditTable);
  }

  async findByEntityType(entityType: string, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<AuditLog>> {
    try {
      return await this.query(
        'EntityTypeIndex',
        { entityType },
        undefined,
        {
          ...options,
          sortOrder: 'DESC' // Most recent first
        }
      );
    } catch (error) {
      this.logger.error('Failed to find audit logs by entity type', error as Error, { entityType });
      throw error;
    }
  }

  async findByEntityId(entityType: string, entityId: string, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<AuditLog>> {
    try {
      const result = await this.scan(
        'entityType = :entityType AND entityId = :entityId',
        {
          ':entityType': entityType,
          ':entityId': entityId
        },
        options
      );
      
      // Sort by timestamp descending
      result.items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return result;
    } catch (error) {
      this.logger.error('Failed to find audit logs by entity ID', error as Error, { entityType, entityId });
      throw error;
    }
  }

  async findByUserId(userId: string, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<AuditLog>> {
    try {
      const result = await this.scan(
        'userId = :userId',
        { ':userId': userId },
        options
      );
      
      // Sort by timestamp descending
      result.items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return result;
    } catch (error) {
      this.logger.error('Failed to find audit logs by user ID', error as Error, { userId });
      throw error;
    }
  }

  async searchAuditLogs(criteria: AuditSearchCriteria, options: { limit?: number; nextToken?: string } = {}): Promise<QueryResult<AuditLog>> {
    try {
      // If searching by entity type only, use the entity type index
      if (criteria.entityType && !Object.keys(criteria).some(key => key !== 'entityType')) {
        return await this.query(
          'EntityTypeIndex',
          { entityType: criteria.entityType },
          undefined,
          { ...options, sortOrder: 'DESC' }
        );
      }

      // For complex criteria, use scan with filters
      const attributeNames: Record<string, string> = {};
      const attributeValues: Record<string, any> = {};
      const filterExpressions: string[] = [];

      if (criteria.entityType) {
        filterExpressions.push('entityType = :entityType');
        attributeValues[':entityType'] = criteria.entityType;
      }

      if (criteria.entityId) {
        filterExpressions.push('entityId = :entityId');
        attributeValues[':entityId'] = criteria.entityId;
      }

      if (criteria.action) {
        filterExpressions.push('#action = :action');
        attributeNames['#action'] = 'action';
        attributeValues[':action'] = criteria.action;
      }

      if (criteria.userId) {
        filterExpressions.push('userId = :userId');
        attributeValues[':userId'] = criteria.userId;
      }

      if (criteria.timestampAfter) {
        filterExpressions.push('#timestamp >= :timestampAfter');
        attributeNames['#timestamp'] = 'timestamp';
        attributeValues[':timestampAfter'] = criteria.timestampAfter;
      }

      if (criteria.timestampBefore) {
        filterExpressions.push('#timestamp <= :timestampBefore');
        attributeNames['#timestamp'] = 'timestamp';
        attributeValues[':timestampBefore'] = criteria.timestampBefore;
      }

      const filterExpression = filterExpressions.length > 0 ? filterExpressions.join(' AND ') : undefined;

      const result = await this.scan(
        filterExpression,
        Object.keys(attributeValues).length > 0 ? attributeValues : undefined,
        options
      );

      // Sort by timestamp descending
      result.items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      return result;
    } catch (error) {
      this.logger.error('Failed to search audit logs', error as Error, { criteria });
      throw error;
    }
  }

  async createAuditLog(
    entityType: string,
    entityId: string,
    action: AuditAction,
    changes: any,
    userId?: string,
    metadata: any = {}
  ): Promise<AuditLog> {
    const now = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days from now

    const auditLog: Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      entityType,
      entityId,
      action,
      userId,
      changes,
      metadata: {
        source: 'api',
        correlationId: metadata.correlationId,
        userAgent: metadata.userAgent,
        ipAddress: metadata.ipAddress,
        sessionId: metadata.sessionId,
        additionalContext: metadata.additionalContext
      },
      timestamp: now,
      ttl
    };

    return await this.create(auditLog);
  }

  async getActionStatsByEntityType(entityType: string, startDate?: string, endDate?: string): Promise<Record<AuditAction, number>> {
    try {
      let result: QueryResult<AuditLog>;

      if (startDate && endDate) {
        result = await this.searchAuditLogs({
          entityType,
          timestampAfter: startDate,
          timestampBefore: endDate
        });
      } else {
        result = await this.findByEntityType(entityType);
      }

      const stats: Record<AuditAction, number> = {} as Record<AuditAction, number>;

      // Initialize all actions with 0
      Object.values(AuditAction).forEach(action => {
        stats[action] = 0;
      });

      result.items.forEach(log => {
        stats[log.action]++;
      });

      return stats;
    } catch (error) {
      this.logger.error('Failed to get action stats by entity type', error as Error, { entityType, startDate, endDate });
      throw error;
    }
  }

  async getUserActivitySummary(userId: string, startDate: string, endDate: string): Promise<{
    totalActions: number;
    actionBreakdown: Record<AuditAction, number>;
    entitiesModified: number;
    mostActiveHour: number;
  }> {
    try {
      const result = await this.searchAuditLogs({
        userId,
        timestampAfter: startDate,
        timestampBefore: endDate
      });

      const actionBreakdown: Record<AuditAction, number> = {} as Record<AuditAction, number>;
      const hourlyActivity: Record<number, number> = {};
      const uniqueEntities = new Set<string>();

      // Initialize action breakdown
      Object.values(AuditAction).forEach(action => {
        actionBreakdown[action] = 0;
      });

      result.items.forEach(log => {
        // Count actions
        actionBreakdown[log.action]++;
        
        // Track unique entities
        uniqueEntities.add(`${log.entityType}:${log.entityId}`);
        
        // Track hourly activity
        const hour = new Date(log.timestamp).getHours();
        hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
      });

      // Find most active hour
      const mostActiveHour = Object.entries(hourlyActivity)
        .reduce((max, [hour, count]) => count > max.count ? { hour: parseInt(hour), count } : max, { hour: 0, count: 0 })
        .hour;

      return {
        totalActions: result.items.length,
        actionBreakdown,
        entitiesModified: uniqueEntities.size,
        mostActiveHour
      };
    } catch (error) {
      this.logger.error('Failed to get user activity summary', error as Error, { userId, startDate, endDate });
      throw error;
    }
  }

  async getDataAccessPatterns(startDate: string, endDate: string): Promise<{
    totalAccess: number;
    entityTypeBreakdown: Record<string, number>;
    actionBreakdown: Record<AuditAction, number>;
    hourlyPattern: Record<number, number>;
  }> {
    try {
      const result = await this.searchAuditLogs({
        timestampAfter: startDate,
        timestampBefore: endDate
      });

      const entityTypeBreakdown: Record<string, number> = {};
      const actionBreakdown: Record<AuditAction, number> = {} as Record<AuditAction, number>;
      const hourlyPattern: Record<number, number> = {};

      // Initialize action breakdown
      Object.values(AuditAction).forEach(action => {
        actionBreakdown[action] = 0;
      });

      result.items.forEach(log => {
        // Count by entity type
        entityTypeBreakdown[log.entityType] = (entityTypeBreakdown[log.entityType] || 0) + 1;
        
        // Count by action
        actionBreakdown[log.action]++;
        
        // Count by hour
        const hour = new Date(log.timestamp).getHours();
        hourlyPattern[hour] = (hourlyPattern[hour] || 0) + 1;
      });

      return {
        totalAccess: result.items.length,
        entityTypeBreakdown,
        actionBreakdown,
        hourlyPattern
      };
    } catch (error) {
      this.logger.error('Failed to get data access patterns', error as Error, { startDate, endDate });
      throw error;
    }
  }

  async cleanupExpiredLogs(): Promise<number> {
    try {
      const now = Math.floor(Date.now() / 1000);
      const result = await this.scan(
        'ttl < :now',
        { ':now': now }
      );

      let deletedCount = 0;
      
      // Delete in batches
      for (const log of result.items) {
        try {
          await this.delete(log.id);
          deletedCount++;
        } catch (error) {
          this.logger.warn('Failed to delete expired audit log', { logId: log.id, error });
        }
      }

      this.logger.info('Cleanup completed', { deletedCount });
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired logs', error as Error);
      throw error;
    }
  }

  async findExpiredAuditLogs(cutoffTimestamp: number): Promise<AuditLog[]> {
    try {
      const result = await this.scan(
        'ttl < :cutoff',
        {
          ':cutoff': cutoffTimestamp
        },
        { limit: 100 } // Process in batches
      );
      
      return result.items;
    } catch (error) {
      this.logger.error('Failed to find expired audit logs', error as Error, { cutoffTimestamp });
      throw error;
    }
  }

  async deleteBatch(logIds: string[]): Promise<void> {
    try {
      const deletePromises = logIds.map(id => this.delete(id));
      await Promise.all(deletePromises);
      
      this.logger.info('Batch deleted audit logs', { count: logIds.length });
    } catch (error) {
      this.logger.error('Failed to batch delete audit logs', error as Error, { logIds });
      throw error;
    }
  }
}
