const Joi = require('joi');
const {
  paginationValidationSchema,
  objectIdSchema,
} = require('./common.validation');

const baseCommentSchema = {
  content: Joi.string().trim().max(1000),
  post: objectIdSchema,
};

const commentValidationSchema = {
  create: Joi.object({
    content: baseCommentSchema.content.required(),
    post: baseCommentSchema.post.required(),
  }),
  update: Joi.object({
    content: baseCommentSchema.content.required(),
  }),
  // query
  getCommentsByPostId: Joi.object({
    ...paginationValidationSchema,
    postId: baseCommentSchema.post.required(),
  }),
};

module.exports = commentValidationSchema;
