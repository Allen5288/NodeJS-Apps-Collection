const Joi = require('joi');
const { objectIdSchema } = require('./common.validation');

const likeValidationSchema = {
  create: Joi.object({
    targetType: Joi.string().valid('Post', 'Comment').required(),
    targetId: objectIdSchema.required(),
    postId: objectIdSchema.required(),
  }),
};

module.exports = likeValidationSchema;
