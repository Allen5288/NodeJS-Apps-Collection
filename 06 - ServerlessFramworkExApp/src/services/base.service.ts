import { createLogger, ContextualLogger } from '@/utils/logger';
import { AuditRepository } from '@/repositories/audit.repository';
import { AuditAction } from '@/models/audit.model';

export abstract class BaseService {
  protected readonly logger: ContextualLogger;
  protected readonly auditRepository: AuditRepository;

  constructor(correlationId?: string, userId?: string) {
    this.logger = createLogger(correlationId, userId);
    this.auditRepository = new AuditRepository();
  }

  protected async createAuditLog(
    entityType: string,
    entityId: string,
    action: AuditAction,
    changes: any,
    userId?: string,
    additionalMetadata: any = {}
  ): Promise<void> {
    try {
      await this.auditRepository.createAuditLog(
        entityType,
        entityId,
        action,
        changes,
        userId,
        additionalMetadata
      );
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.warn('Failed to create audit log', { 
        entityType, 
        entityId, 
        action, 
        error: (error as Error).message 
      });
    }
  }

  protected validateBusinessRules(rules: Array<{ condition: boolean; message: string; code?: string }>): void {
    const failedRules = rules.filter(rule => !rule.condition);
    
    if (failedRules.length > 0) {
      const error = new Error(`Business rule violations: ${failedRules.map(r => r.message).join(', ')}`);
      (error as any).code = 'BUSINESS_RULE_VIOLATION';
      (error as any).statusCode = 422;
      (error as any).details = { violations: failedRules };
      throw error;
    }
  }

  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  protected getCurrentTimestamp(): string {
    return new Date().toISOString();
  }

  protected calculateTTL(daysFromNow: number): number {
    return Math.floor(Date.now() / 1000) + (daysFromNow * 24 * 60 * 60);
  }

  protected sanitizeForAudit(data: any): any {
    // Remove sensitive information from audit logs
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
    
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    const sanitized = { ...data };
    
    const sanitizeObject = (obj: any): any => {
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const [key, value] of Object.entries(obj)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            result[key] = '[REDACTED]';
          } else {
            result[key] = sanitizeObject(value);
          }
        }
        return result;
      }
      
      return obj;
    };

    return sanitizeObject(sanitized);
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }

        // Don't retry for client errors (4xx)
        if ((error as any).statusCode && (error as any).statusCode < 500) {
          break;
        }

        const delay = Math.min(baseDelayMs * Math.pow(2, attempt), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        this.logger.warn(`Retrying operation after error (attempt ${attempt + 1}/${maxRetries + 1})`, {
          error: (error as Error).message,
          nextRetryIn: delay
        });
      }
    }

    throw lastError!;
  }

  protected async validateExistence<T>(
    entity: T | null,
    entityType: string,
    identifier: string
  ): Promise<T> {
    if (!entity) {
      const error = new Error(`${entityType} with identifier '${identifier}' not found`);
      (error as any).code = 'NOT_FOUND';
      (error as any).statusCode = 404;
      throw error;
    }
    return entity;
  }

  protected async validateUniqueness<T>(
    existingEntity: T | null,
    field: string,
    value: string,
    entityType: string
  ): Promise<void> {
    if (existingEntity) {
      const error = new Error(`${entityType} with ${field} '${value}' already exists`);
      (error as any).code = 'CONFLICT';
      (error as any).statusCode = 409;
      (error as any).details = { field, value };
      throw error;
    }
  }

  protected buildChangeSet(before: any, after: any): any {
    const changes: any = { before: {}, after: {}, fields: [] };
    
    const compareObjects = (obj1: any, obj2: any, path: string = '') => {
      const allKeys = new Set([...Object.keys(obj1 || {}), ...Object.keys(obj2 || {})]);
      
      for (const key of allKeys) {
        const currentPath = path ? `${path}.${key}` : key;
        const val1 = obj1?.[key];
        const val2 = obj2?.[key];
        
        if (JSON.stringify(val1) !== JSON.stringify(val2)) {
          changes.fields.push(currentPath);
          if (path === '') {
            changes.before[key] = val1;
            changes.after[key] = val2;
          }
        }
      }
    };

    compareObjects(before, after);
    return changes;
  }
}
