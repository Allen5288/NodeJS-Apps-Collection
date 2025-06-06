const Joi = require('joi');

const baseAuthSchema = {
  username: Joi.string().alphanum().min(3).max(20).required().messages({
    'string.min': 'username must be at least 3 characters long',
    'string.alphanum': 'username must only contains alphanumeric characters',
  }),
  password: Joi.string().min(6).max(30).required(),
  // email:
};

const authValidationSchema = {
  register: Joi.object({
    ...baseAuthSchema,
  }),
  login: Joi.object({
    ...baseAuthSchema,
  }),
};

module.exports = authValidationSchema;
