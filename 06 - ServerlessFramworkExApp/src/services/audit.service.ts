import { BaseService } from './base.service';
import { AuditRepository } from '@/repositories/audit.repository';
import { AuditAction, AuditLog } from '@/models/audit.model';

export class AuditService extends BaseService {
  private readonly auditRepo: AuditRepository;

  constructor(correlationId?: string, userId?: string) {
    super(correlationId, userId);
    this.auditRepo = new AuditRepository();
  }

  override async createAuditLog(
    entityType: string,
    entityId: string,
    action: AuditAction,
    metadata?: any
  ): Promise<void> {
    try {
      const auditData: Omit<AuditLog, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
        entityType,
        entityId,
        action,
        userId: metadata?.userId || 'system',
        changes: {
          fields: Object.keys(metadata?.changes || {}),
          after: metadata?.changes
        },
        metadata: {
          source: 'API',
          correlationId: metadata?.correlationId,
          additionalContext: metadata
        },
        timestamp: this.getCurrentTimestamp(),
        ttl: this.calculateTTL(365) // 1 year retention
      };

      await this.auditRepo.create(auditData);

      this.logger.info('Audit log created', {
        entityType,
        entityId,
        action,
        userId: metadata?.userId
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error instanceof Error ? error : undefined, {
        entityType,
        entityId,
        action
      });
      // Don't throw - audit logging failures shouldn't break main operations
    }
  }
}
