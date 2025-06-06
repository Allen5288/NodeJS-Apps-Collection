const { Router } = require('express');
const { getPopularHashtags } = require('../controllers/hashtag.controller');
const { validateQuery } = require('../middleware/validation.middleware');
const hashtagValidationSchema = require('../validations/hashtag.validation');

const hashtagRouter = Router();

hashtagRouter.get(
  '/popular',
  validateQuery(hashtagValidationSchema.populate),
  getPopularHashtags
);

module.exports = hashtagRouter;
