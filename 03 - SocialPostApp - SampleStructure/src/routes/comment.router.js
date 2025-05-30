const { Router } = require('express');
const {
  validateBody,
  validateQuery,
  validateObjectId,
} = require('../middleware/validation.middleware');
const {
  createComment,
  getCommentsByPostId,
  updateCommentById,
  deleteCommentById,
} = require('../controllers/comment.controller');

const authGuardMiddleware = require('../middleware/authGuard.middleware');
const commentValidationSchema = require('../validations/comment.validation');

const commentRouter = Router();

commentRouter.post(
  '/',
  authGuardMiddleware,
  validateBody(commentValidationSchema.create),
  createComment
);

// GET /v1/comments?postId=xxxx
// GET /v1/posts/:postId/comments
commentRouter.get(
  '/',
  validateQuery(commentValidationSchema.getCommentsByPostId),
  getCommentsByPostId
);

commentRouter.put(
  '/:id',
  validateObjectId('id'),
  authGuardMiddleware,
  validateBody(commentValidationSchema.update),
  updateCommentById
);

commentRouter.delete(
  '/:id',
  authGuardMiddleware,
  validateObjectId('id'),
  deleteCommentById
);

module.exports = commentRouter;
