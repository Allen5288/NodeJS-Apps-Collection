import Joi from 'joi';
import { ValidationError } from './errors';

export const validateRequest = <T>(body: string | null, schema: Joi.ObjectSchema): T => {
  if (!body) {
    throw new ValidationError('Request body is required');
  }

  let parsedBody: any;
  try {
    parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
  } catch (error) {
    throw new ValidationError('Invalid JSON in request body');
  }

  const { error, value } = schema.validate(parsedBody, { 
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const details = error.details.map(detail => detail.message).join(', ');
    throw new ValidationError(`Validation failed: ${details}`);
  }

  return value as T;
};

// Common validation schemas
export const commonSchemas = {
  id: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).min(10).max(20),
  url: Joi.string().uri(),
  timestamp: Joi.string().isoDate(),
  currency: Joi.string().length(3).uppercase(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE'),
  
  // Additional common patterns
  countryCode: Joi.string().length(2).uppercase(),
  price: Joi.number().positive().precision(2),
  quantity: Joi.number().integer().min(0),
  positiveQuantity: Joi.number().integer().min(1),
  
  // Common address schema
  address: Joi.object({
    street: Joi.string().min(1).max(200).required(),
    city: Joi.string().min(1).max(100).required(),
    state: Joi.string().min(1).max(100).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().length(2).uppercase().required()
  }),
  
  // Named address schema (with contact info)
  namedAddress: Joi.object({
    street: Joi.string().min(1).max(200).required(),
    city: Joi.string().min(1).max(100).required(),
    state: Joi.string().min(1).max(100).required(),
    zipCode: Joi.string().min(3).max(20).required(),
    country: Joi.string().length(2).uppercase().required(),
    name: Joi.string().min(1).max(100).required(),
    phone: Joi.string().pattern(/^\+?[\d\s-()]+$/).min(10).max(20).optional()
  }),
  
  pagination: Joi.object({
    limit: Joi.number().integer().min(1).max(100).default(20),
    nextToken: Joi.string().optional(),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC')
  })
};

// User validation schemas
export const userSchemas = {
  create: Joi.object({
    email: commonSchemas.email,
    name: commonSchemas.name,
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50).required(),
      lastName: Joi.string().min(1).max(50).required(),
      phoneNumber: commonSchemas.phone.optional(),
      address: Joi.object({
        street: Joi.string().min(1).max(200).required(),
        city: Joi.string().min(1).max(100).required(),
        state: Joi.string().min(1).max(100).required(),
        zipCode: Joi.string().min(3).max(20).required(),
        country: Joi.string().length(2).uppercase().required()
      }).optional(),
      preferences: Joi.object({
        emailNotifications: Joi.boolean().default(true),
        smsNotifications: Joi.boolean().default(false),
        marketingEmails: Joi.boolean().default(false),
        language: Joi.string().length(2).lowercase().default('en'),
        timezone: Joi.string().default('UTC')
      }).optional()
    }).required()
  }),

  update: Joi.object({
    name: commonSchemas.name.optional(),
    profile: Joi.object({
      firstName: Joi.string().min(1).max(50),
      lastName: Joi.string().min(1).max(50),
      phoneNumber: commonSchemas.phone,
      address: Joi.object({
        street: Joi.string().min(1).max(200),
        city: Joi.string().min(1).max(100),
        state: Joi.string().min(1).max(100),
        zipCode: Joi.string().min(3).max(20),
        country: Joi.string().length(2).uppercase()
      }),
      preferences: Joi.object({
        emailNotifications: Joi.boolean(),
        smsNotifications: Joi.boolean(),
        marketingEmails: Joi.boolean(),
        language: Joi.string().length(2).lowercase(),
        timezone: Joi.string()
      })
    }).optional(),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING_VERIFICATION', 'SUSPENDED', 'DELETED').optional()
  }).min(1)
};

// Product validation schemas
export const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    description: Joi.string().min(1).max(2000).required(),
    category: Joi.string().min(1).max(100).required(),
    price: Joi.number().positive().precision(2).required(),
    currency: commonSchemas.currency.required(),
    sku: Joi.string().min(1).max(50).required(),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0).required(),
      lowStockThreshold: Joi.number().integer().min(0).default(10),
      trackInventory: Joi.boolean().default(true)
    }).required(),
    metadata: Joi.object({
      weight: Joi.number().positive().optional(),
      dimensions: Joi.object({
        length: Joi.number().positive().required(),
        width: Joi.number().positive().required(),
        height: Joi.number().positive().required(),
        unit: Joi.string().valid('cm', 'in').required()
      }).optional(),
      manufacturer: Joi.string().max(100).optional(),
      warranty: Joi.string().max(100).optional(),
      specifications: Joi.object().pattern(Joi.string(), Joi.string()).default({})
    }).optional(),
    images: Joi.array().items(Joi.string().uri()).max(10).default([]),
    tags: Joi.array().items(Joi.string().max(50)).max(20).default([])
  }),

  update: Joi.object({
    name: Joi.string().min(1).max(200),
    description: Joi.string().min(1).max(2000),
    category: Joi.string().min(1).max(100),
    price: Joi.number().positive().precision(2),
    status: Joi.string().valid('ACTIVE', 'INACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED', 'DRAFT'),
    inventory: Joi.object({
      quantity: Joi.number().integer().min(0),
      lowStockThreshold: Joi.number().integer().min(0),
      trackInventory: Joi.boolean()
    }),
    metadata: Joi.object({
      weight: Joi.number().positive(),
      dimensions: Joi.object({
        length: Joi.number().positive().required(),
        width: Joi.number().positive().required(),
        height: Joi.number().positive().required(),
        unit: Joi.string().valid('cm', 'in').required()
      }),
      manufacturer: Joi.string().max(100),
      warranty: Joi.string().max(100),
      specifications: Joi.object().pattern(Joi.string(), Joi.string())
    }),
    images: Joi.array().items(Joi.string().uri()).max(10),
    tags: Joi.array().items(Joi.string().max(50)).max(20)
  }).min(1)
};

// Order validation schemas
export const orderSchemas = {
  create: Joi.object({
    userId: commonSchemas.id,
    items: Joi.array().items(
      Joi.object({
        productId: commonSchemas.id,
        quantity: Joi.number().integer().min(1).max(1000).required(),
        unitPrice: Joi.number().positive().precision(2).required(),
        currency: commonSchemas.currency.required()
      })
    ).min(1).max(50).required(),
    shipping: Joi.object({
      address: Joi.object({
        street: Joi.string().min(1).max(200).required(),
        city: Joi.string().min(1).max(100).required(),
        state: Joi.string().min(1).max(100).required(),
        zipCode: Joi.string().min(3).max(20).required(),
        country: Joi.string().length(2).uppercase().required()
      }).required(),
      method: Joi.string().min(1).max(50).required(),
      estimatedDelivery: commonSchemas.timestamp.optional()
    }).required(),
    payment: Joi.object({
      method: Joi.string().valid('CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH_ON_DELIVERY').required(),
      reference: Joi.string().max(100).optional()
    }).required(),
    metadata: Joi.object({
      source: Joi.string().max(50).default('web'),
      customerNotes: Joi.string().max(500).optional(),
      promotionCodes: Joi.array().items(Joi.string().max(50)).max(5).default([]),
      referralCode: Joi.string().max(50).optional()
    }).optional()
  }),

  update: Joi.object({
    status: Joi.string().valid('PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED', 'FAILED'),
    shipping: Joi.object({
      method: Joi.string().min(1).max(50),
      estimatedDelivery: commonSchemas.timestamp,
      actualDelivery: commonSchemas.timestamp
    }),
    payment: Joi.object({
      status: Joi.string().valid('PENDING', 'AUTHORIZED', 'CAPTURED', 'FAILED', 'REFUNDED', 'PARTIALLY_REFUNDED'),
      transactionId: Joi.string().max(100),
      reference: Joi.string().max(100),
      processedAt: commonSchemas.timestamp
    }),
    tracking: Joi.object({
      carrier: Joi.string().max(50).required(),
      trackingNumber: Joi.string().max(100).required(),
      trackingUrl: commonSchemas.url.optional(),
      status: Joi.string().max(50).required(),
      estimatedDelivery: commonSchemas.timestamp.optional()
    }),
    metadata: Joi.object({
      internalNotes: Joi.string().max(1000),
      promotionCodes: Joi.array().items(Joi.string().max(50)).max(5),
      referralCode: Joi.string().max(50)
    })
  }).min(1)
};

// Generic validation function
export const validate = <T>(schema: Joi.ObjectSchema<T>, data: any): T => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true
  });

  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));

    throw new ValidationError('Validation failed', { validationErrors: details });
  }

  return value;
};

// Validation middleware factory
export const createValidationMiddleware = (schema: Joi.ObjectSchema) => {
  return (data: any) => validate(schema, data);
};

// Custom validation rules
export const customValidations = {
  isValidSKU: (sku: string): boolean => {
    return /^[A-Z0-9]{3,20}$/.test(sku);
  },

  isValidOrderTotal: (total: number, currency: string): boolean => {
    if (currency === 'USD' && total > 50000) return false;
    if (currency === 'EUR' && total > 45000) return false;
    return total > 0;
  },

  isValidInventoryQuantity: (quantity: number, reserved: number): boolean => {
    return quantity >= 0 && reserved >= 0 && reserved <= quantity;
  },

  isValidPhoneNumber: (phone: string): boolean => {
    return /^\+?[\d\s-()]{10,20}$/.test(phone);
  },

  isValidPostalCode: (code: string, country: string): boolean => {
    const patterns: Record<string, RegExp> = {
      US: /^\d{5}(-\d{4})?$/,
      CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/,
      GB: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/,
      DE: /^\d{5}$/,
      FR: /^\d{5}$/
    };

    const pattern = patterns[country.toUpperCase()];
    return pattern ? pattern.test(code) : true; // Default to true for unknown countries
  }
};
