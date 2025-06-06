const Joi = require('joi');
const { paginationValidationSchema } = require('./common.validation');

const basePostSchema = {
  title: Joi.string().trim().min(2).max(100),
  content: Joi.string().trim().max(1000),
};

const postValidationSchema = {
  create: Joi.object({
    title: basePostSchema.title.required(),
    content: basePostSchema.content.required(),
  }),
  search: Joi.object({
    q: Joi.string().trim().min(2),
    ...paginationValidationSchema,
  }),
  update: Joi.object({
    ...basePostSchema,
  }),
};

module.exports = postValidationSchema;
