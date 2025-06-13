const Joi = require('joi');

// User validation schemas
const userSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    email: Joi.string().email().required(),
    age: Joi.number().integer().min(1).max(120).optional(),
    city: Joi.string().min(2).max(255).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    email: Joi.string().email().optional(),
    age: Joi.number().integer().min(1).max(120).optional(),
    city: Joi.string().min(2).max(255).optional()
  }).min(1)
};

// Product validation schemas
const productSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(255).required(),
    description: Joi.string().max(1000).optional(),
    price: Joi.number().positive().precision(2).required(),
    category: Joi.string().min(2).max(255).optional(),
    stock_quantity: Joi.number().integer().min(0).optional()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(255).optional(),
    description: Joi.string().max(1000).optional(),
    price: Joi.number().positive().precision(2).optional(),
    category: Joi.string().min(2).max(255).optional(),
    stock_quantity: Joi.number().integer().min(0).optional()
  }).min(1),

  updateStock: Joi.object({
    stock_quantity: Joi.number().integer().min(0).required()
  })
};

// Common validation schemas
const commonSchemas = {
  id: Joi.number().integer().positive().required(),
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10)
  }),
  search: Joi.object({
    q: Joi.string().min(1).max(255).required()
  })
};

// Validation middleware
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    req[property] = value;
    next();
  };
};

module.exports = {
  userSchemas,
  productSchemas,
  commonSchemas,
  validate
};
