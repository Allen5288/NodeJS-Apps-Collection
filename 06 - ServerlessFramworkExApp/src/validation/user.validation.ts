import Joi from 'joi';
import { commonSchemas } from '@/utils/validation';

export const userCreateSchema = Joi.object({
  email: commonSchemas.email,
  name: commonSchemas.name,
  profile: Joi.object({
    firstName: Joi.string().min(1).max(50).required(),
    lastName: Joi.string().min(1).max(50).required(),
    phoneNumber: commonSchemas.phone.optional(),
    address: commonSchemas.address.optional(),
    preferences: Joi.object({
      emailNotifications: Joi.boolean().default(true),
      smsNotifications: Joi.boolean().default(false),
      marketingEmails: Joi.boolean().default(false),
      language: Joi.string().length(2).lowercase().default('en'),
      timezone: Joi.string().default('UTC')
    }).optional()
  }).required()
});

export const userUpdateSchema = Joi.object({
  name: commonSchemas.name.optional(),
  profile: Joi.object({
    firstName: Joi.string().min(1).max(50),
    lastName: Joi.string().min(1).max(50),
    phoneNumber: commonSchemas.phone,
    address: commonSchemas.address,
    preferences: Joi.object({
      emailNotifications: Joi.boolean(),
      smsNotifications: Joi.boolean(),
      marketingEmails: Joi.boolean(),
      language: Joi.string().length(2).lowercase(),
      timezone: Joi.string()
    })
  }).optional(),
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED').optional()
}).min(1);

export const userStatusUpdateSchema = Joi.object({
  status: Joi.string().valid('ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED').required(),
  reason: Joi.string().max(500).optional()
});
