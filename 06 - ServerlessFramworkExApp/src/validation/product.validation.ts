import Joi from 'joi';
import { commonSchemas } from '@/utils/validation';

export const productCreateSchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  description: Joi.string().min(10).max(2000).required(),
  category: Joi.string().min(2).max(100).required(),
  price: commonSchemas.price.required(),
  currency: commonSchemas.currency.default('USD'),
  sku: Joi.string().min(1).max(100).required(),
  inventory: Joi.object({
    quantity: commonSchemas.quantity.required(),
    reserved: commonSchemas.quantity.default(0),
    lowStockThreshold: commonSchemas.quantity.default(10),
    trackInventory: Joi.boolean().default(true)
  }).required(),
  attributes: Joi.object({
    weight: Joi.number().positive().optional(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'in').default('cm')
    }).optional(),
    color: Joi.string().max(50).optional(),
    material: Joi.string().max(100).optional(),
    brand: Joi.string().max(100).optional(),
    tags: Joi.array().items(Joi.string().max(50)).max(20).optional()
  }).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false)
    })
  ).max(10).optional(),
  isActive: Joi.boolean().default(true)
});

export const productUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  category: Joi.string().min(2).max(100).optional(),
  price: commonSchemas.price.optional(),
  currency: commonSchemas.currency.optional(),
  inventory: Joi.object({
    quantity: commonSchemas.quantity,
    reserved: commonSchemas.quantity,
    lowStockThreshold: commonSchemas.quantity,
    trackInventory: Joi.boolean()
  }).optional(),
  attributes: Joi.object({
    weight: Joi.number().positive(),
    dimensions: Joi.object({
      length: Joi.number().positive(),
      width: Joi.number().positive(),
      height: Joi.number().positive(),
      unit: Joi.string().valid('cm', 'in')
    }),
    color: Joi.string().max(50),
    material: Joi.string().max(100),
    brand: Joi.string().max(100),
    tags: Joi.array().items(Joi.string().max(50)).max(20)
  }).optional(),
  images: Joi.array().items(
    Joi.object({
      url: Joi.string().uri().required(),
      alt: Joi.string().max(200).optional(),
      isPrimary: Joi.boolean().default(false)
    })
  ).max(10).optional(),
  isActive: Joi.boolean().optional()
}).min(1);

export const inventoryUpdateSchema = Joi.object({
  quantity: Joi.number().integer().min(0).required(),
  operation: Joi.string().valid('SET', 'ADD', 'SUBTRACT').default('SET'),
  reason: Joi.string().max(500).optional()
});
