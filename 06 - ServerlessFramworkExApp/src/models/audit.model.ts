export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  changes: AuditChanges;
  metadata: AuditMetadata;
  timestamp: string;
  ttl: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface AuditChanges {
  before?: Record<string, any>;
  after?: Record<string, any>;
  fields: string[];
}

export interface AuditMetadata {
  source: string;
  userAgent?: string;
  ipAddress?: string;
  correlationId?: string;
  sessionId?: string;
  additionalContext?: Record<string, any>;
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  ACCESS = 'ACCESS',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT'
}

export interface CreateAuditLogRequest {
  entityType: string;
  entityId: string;
  action: AuditAction;
  userId?: string;
  changes: AuditChanges;
  metadata: AuditMetadata;
}

export interface AuditSearchCriteria {
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  userId?: string;
  timestampAfter?: string;
  timestampBefore?: string;
}

export interface PaginatedAuditLogs {
  logs: AuditLog[];
  nextToken?: string;
  totalCount?: number;
}
