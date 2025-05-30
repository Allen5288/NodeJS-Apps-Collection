const Joi = require('joi');
const { paginationValidationSchema } = require('./common.validation');

const hashtagValidationSchema = {
  populate: Joi.object({
    ...paginationValidationSchema,
  }),
};

module.exports = hashtagValidationSchema;
