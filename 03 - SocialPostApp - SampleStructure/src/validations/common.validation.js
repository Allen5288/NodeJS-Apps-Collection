const Joi = require('joi');
const mongoose = require('mongoose');

const paginationValidationSchema = {
  limit: Joi.number().integer().min(10).max(100).optional().default(10),
  page: Joi.number().integer().min(1).optional().default(1),
};

const objectIdValidator = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};
const objectIdSchema = Joi.string()
  .custom(objectIdValidator, 'object id validation')
  .messages({
    'any.invalid': '{{#label}} must be a valid object id',
  });

module.exports = {
  paginationValidationSchema,
  objectIdSchema,
};
