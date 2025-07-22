export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, any> | undefined;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: Record<string, any>
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
    // Only use captureStackTrace if available (Node.js specific)
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super(`${resource} with identifier '${identifier}' not found`, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: Record<string, any>) {
    super(message, 409, 'CONFLICT', true, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class BusinessRuleError extends AppError {
  constructor(rule: string, message: string, details?: Record<string, any>) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', true, { rule, ...details });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string, details?: Record<string, any>) {
    super(`External service error from ${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR', true, { service, ...details });
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, window: string) {
    super(`Rate limit exceeded: ${limit} requests per ${window}`, 429, 'RATE_LIMIT_EXCEEDED', true, { limit, window });
  }
}

// Error handler for API responses
export const handleError = (error: Error): { statusCode: number; body: string } => {
  let statusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'Internal server error';
  let details: Record<string, any> | undefined;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    code = error.code;
    message = error.message;
    details = error.details;
  } else {
    // Log unexpected errors
    console.error('Unexpected error:', error);
  }

  const errorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details })
    }
  };

  return {
    statusCode,
    body: JSON.stringify(errorResponse)
  };
};

// Circuit breaker pattern
export class CircuitBreaker {
  private failures: number = 0;
  private lastFailTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly failureThreshold: number = 5,
    private readonly recoveryTimeoutMs: number = 60000
  ) {}

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailTime >= this.recoveryTimeoutMs) {
        this.state = 'HALF_OPEN';
      } else {
        throw new AppError('Circuit breaker is OPEN', 503, 'CIRCUIT_BREAKER_OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailTime = Date.now();
    
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Retry utility with exponential backoff
export const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelayMs: number = 1000,
  maxDelayMs: number = 10000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        break;
      }

      // Calculate exponential backoff delay
      const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};
