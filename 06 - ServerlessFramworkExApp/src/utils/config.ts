export interface Config {
  aws: {
    region: string;
    dynamodb: {
      usersTable: string;
      productsTable: string;
      ordersTable: string;
      auditTable: string;
    };
    sqs: {
      orderProcessingQueue: string;
      notificationQueue: string;
    };
    sns: {
      orderEventsTopic: string;
      userEventsTopic: string;
      inventoryAlertsTopic: string;
    };
    cognito: {
      userPoolId: string;
      userPoolClientId: string;
    };
    s3: {
      uploadsBucket: string;
    };
  };
  app: {
    stage: string;
    serviceName: string;
    logLevel: string;
    correlationIdHeader: string;
    jwtSecret: string;
    passwordSaltRounds: number;
    frontendUrl: string;
  };
  business: {
    order: {
      maxItemsPerOrder: number;
      maxOrderValue: number;
      defaultCurrency: string;
      taxRate: number;
    };
    inventory: {
      lowStockThreshold: number;
      reservationTimeoutMinutes: number;
    };
    notifications: {
      orderConfirmationTemplate: string;
      orderShippedTemplate: string;
      lowStockTemplate: string;
    };
  };
}

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is required`);
  }
  return value || defaultValue || '';
};

const getOptionalEnvVar = (name: string, defaultValue: string): string => {
  return process.env[name] || defaultValue;
};

const getNumericEnvVar = (name: string, defaultValue: number): number => {
  const value = process.env[name];
  if (value === undefined) {
    return defaultValue;
  }
  const numericValue = parseInt(value, 10);
  if (isNaN(numericValue)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return numericValue;
};

export const config: Config = {
  aws: {
    region: getEnvVar('REGION', 'us-east-1'),
    dynamodb: {
      usersTable: getEnvVar('USERS_TABLE'),
      productsTable: getEnvVar('PRODUCTS_TABLE'),
      ordersTable: getEnvVar('ORDERS_TABLE'),
      auditTable: getEnvVar('AUDIT_TABLE'),
    },
    sqs: {
      orderProcessingQueue: getEnvVar('ORDER_PROCESSING_QUEUE'),
      notificationQueue: getEnvVar('NOTIFICATION_QUEUE'),
    },
    sns: {
      orderEventsTopic: getEnvVar('ORDER_EVENTS_TOPIC'),
      userEventsTopic: getEnvVar('USER_EVENTS_TOPIC'),
      inventoryAlertsTopic: getEnvVar('INVENTORY_ALERTS_TOPIC'),
    },
    cognito: {
      userPoolId: getEnvVar('USER_POOL_ID'),
      userPoolClientId: getEnvVar('USER_POOL_CLIENT_ID'),
    },
    s3: {
      uploadsBucket: getEnvVar('UPLOADS_BUCKET'),
    },
  },
  app: {
    stage: getOptionalEnvVar('STAGE', 'dev'),
    serviceName: getOptionalEnvVar('SERVICE_NAME', 'serverless-app'),
    logLevel: getOptionalEnvVar('LOG_LEVEL', 'info'),
    correlationIdHeader: getOptionalEnvVar('CORRELATION_ID_HEADER', 'x-correlation-id'),
    jwtSecret: getEnvVar('JWT_SECRET'),
    passwordSaltRounds: getNumericEnvVar('PASSWORD_SALT_ROUNDS', 12),
    frontendUrl: getOptionalEnvVar('FRONTEND_URL', 'https://app.example.com'),
  },
  business: {
    order: {
      maxItemsPerOrder: getNumericEnvVar('MAX_ITEMS_PER_ORDER', 50),
      maxOrderValue: getNumericEnvVar('MAX_ORDER_VALUE', 10000),
      defaultCurrency: getOptionalEnvVar('DEFAULT_CURRENCY', 'USD'),
      taxRate: getNumericEnvVar('TAX_RATE', 8.5) / 100, // Convert percentage to decimal
    },
    inventory: {
      lowStockThreshold: getNumericEnvVar('LOW_STOCK_THRESHOLD', 10),
      reservationTimeoutMinutes: getNumericEnvVar('RESERVATION_TIMEOUT_MINUTES', 15),
    },
    notifications: {
      orderConfirmationTemplate: getOptionalEnvVar('ORDER_CONFIRMATION_TEMPLATE', 'order-confirmation'),
      orderShippedTemplate: getOptionalEnvVar('ORDER_SHIPPED_TEMPLATE', 'order-shipped'),
      lowStockTemplate: getOptionalEnvVar('LOW_STOCK_TEMPLATE', 'low-stock-alert'),
    },
  },
};

// Validate critical configuration
export const validateConfig = (): void => {
  const criticalVars = [
    'USERS_TABLE',
    'PRODUCTS_TABLE', 
    'ORDERS_TABLE',
    'AUDIT_TABLE',
    'ORDER_PROCESSING_QUEUE',
    'NOTIFICATION_QUEUE',
    'ORDER_EVENTS_TOPIC',
    'USER_EVENTS_TOPIC',
    'USER_POOL_ID',
    'USER_POOL_CLIENT_ID',
    'UPLOADS_BUCKET',
    'JWT_SECRET'
  ];

  const missingVars = criticalVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};
