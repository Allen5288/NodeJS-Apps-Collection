import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';
const serviceName = process.env.SERVICE_NAME || 'serverless-app';
const stage = process.env.STAGE || 'dev';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, correlationId, userId, ...meta } = info;
    
    return JSON.stringify({
      timestamp,
      level,
      message,
      service: serviceName,
      stage,
      correlationId,
      userId,
      ...meta
    });
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: logLevel,
  format: logFormat,
  defaultMeta: {
    service: serviceName,
    stage
  },
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
      handleRejections: true
    })
  ]
});

// Logger with correlation context
export class ContextualLogger {
  private correlationId?: string | undefined;
  private userId?: string | undefined;

  constructor(correlationId?: string, userId?: string) {
    this.correlationId = correlationId;
    this.userId = userId;
  }

  private addContext(meta: any = {}): any {
    return {
      ...meta,
      correlationId: this.correlationId,
      userId: this.userId
    };
  }

  info(message: string, meta?: any): void {
    logger.info(message, this.addContext(meta));
  }

  error(message: string, error?: Error, meta?: any): void {
    logger.error(message, this.addContext({
      ...meta,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    }));
  }

  warn(message: string, meta?: any): void {
    logger.warn(message, this.addContext(meta));
  }

  debug(message: string, meta?: any): void {
    logger.debug(message, this.addContext(meta));
  }
}

// Create logger factory
export const createLogger = (correlationId?: string, userId?: string): ContextualLogger => {
  return new ContextualLogger(correlationId, userId);
};
