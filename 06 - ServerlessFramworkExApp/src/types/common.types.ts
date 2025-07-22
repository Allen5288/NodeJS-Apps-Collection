export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMetadata;
}

export interface PaginationMetadata {
  nextToken?: string;
  totalCount?: number;
  limit: number;
  offset?: number;
}

export interface PaginationRequest {
  limit?: number;
  nextToken?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface BusinessRule {
  name: string;
  description: string;
  condition: (data: any) => boolean;
  errorMessage: string;
}

export interface EventPayload<T = any> {
  eventType: string;
  entityType: string;
  entityId: string;
  data: T;
  metadata: EventMetadata;
}

export interface EventMetadata {
  correlationId: string;
  causationId?: string;
  userId?: string;
  timestamp: string;
  source: string;
  version: string;
}
