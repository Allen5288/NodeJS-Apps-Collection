const { Router } = require('express');
const {
  validateBody,
  validateObjectId,
} = require('../middleware/validation.middleware');
const likeValidationSchema = require('../validations/like.validation');
const authGuardMiddleware = require('../middleware/authGuard.middleware');
const {
  createLike,
  deleteLikeById,
} = require('../controllers/like.controller');

const likeRouter = Router();

likeRouter.post(
  '/',
  authGuardMiddleware,
  validateBody(likeValidationSchema.create),
  createLike
);

likeRouter.delete(
  '/:id',
  authGuardMiddleware,
  validateObjectId('id'),
  deleteLikeById
);

module.exports = likeRouter;
