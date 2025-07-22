import Joi from 'joi';
import { commonSchemas } from '@/utils/validation';

export const orderCreateSchema = Joi.object({
  userId: commonSchemas.id,
  items: Joi.array().items(
    Joi.object({
      productId: commonSchemas.id,
      quantity: commonSchemas.positiveQuantity.max(1000).required(),
      price: commonSchemas.price.required(),
      currency: commonSchemas.currency.default('USD')
    })
  ).min(1).max(50).required(),
  shippingAddress: commonSchemas.namedAddress.required(),
  billingAddress: commonSchemas.namedAddress.optional(),
  payment: Joi.object({
    method: Joi.string().valid('CARD', 'PAYPAL', 'BANK_TRANSFER', 'DIGITAL_WALLET').required(),
    currency: commonSchemas.currency.default('USD'),
    details: Joi.object().optional()
  }).required(),
  notes: Joi.string().max(1000).optional(),
  expectedDeliveryDate: commonSchemas.timestamp.optional()
});

export const orderUpdateSchema = Joi.object({
  status: Joi.string().valid(
    'PENDING', 
    'CONFIRMED', 
    'PROCESSING', 
    'SHIPPED', 
    'DELIVERED', 
    'CANCELLED', 
    'REFUNDED'
  ).optional(),
  tracking: Joi.object({
    carrier: Joi.string().max(100),
    trackingNumber: Joi.string().max(200),
    estimatedDelivery: Joi.string().isoDate(),
    lastUpdate: Joi.string().isoDate()
  }).optional(),
  payment: Joi.object({
    status: Joi.string().valid('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
    transactionId: Joi.string().max(200),
    processedAt: Joi.string().isoDate(),
    failureReason: Joi.string().max(500)
  }).optional(),
  fulfillment: Joi.object({
    status: Joi.string().valid('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED'),
    shippedAt: Joi.string().isoDate(),
    deliveredAt: Joi.string().isoDate(),
    notes: Joi.string().max(1000)
  }).optional(),
  notes: Joi.string().max(1000).optional()
}).min(1);

export const orderCancelSchema = Joi.object({
  reason: Joi.string().valid(
    'CUSTOMER_REQUEST',
    'OUT_OF_STOCK',
    'PAYMENT_FAILED',
    'FRAUD_DETECTED',
    'SHIPPING_ISSUES',
    'OTHER'
  ).required(),
  notes: Joi.string().max(1000).optional(),
  refundAmount: Joi.number().positive().precision(2).optional()
});

export const orderSearchSchema = Joi.object({
  status: Joi.string().valid(
    'PENDING', 
    'CONFIRMED', 
    'PROCESSING', 
    'SHIPPED', 
    'DELIVERED', 
    'CANCELLED', 
    'REFUNDED'
  ).optional(),
  userId: Joi.string().min(1).max(100).optional(),
  startDate: Joi.string().isoDate().optional(),
  endDate: Joi.string().isoDate().optional(),
  minAmount: Joi.number().positive().precision(2).optional(),
  maxAmount: Joi.number().positive().precision(2).optional(),
  limit: Joi.number().integer().min(1).max(100).default(20),
  lastKey: Joi.string().optional()
});
