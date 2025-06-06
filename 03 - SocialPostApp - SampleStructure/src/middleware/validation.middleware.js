const mongoose = require('mongoose');
const ValidationException = require('../exceptions/validation.exception');

// /posts/:postId/comments/:commentId
const validateObjectId = (key) => {
  return (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params[key])) {
      next(new ValidationException(`${key} is not a valid objectId`));
      return;
    }
    next();
  };
};

const validateBody = (schema) => {
  return async (req, res, next) => {
    try {
      const value = await schema.validateAsync(req.body, {
        allowUnknown: true,
        stripUnknown: true,
      });
      req.body = value;
      next();
    } catch (e) {
      next(new ValidationException(e.details[0].message, e));
    }
  };
};

const validateQuery = (schema) => {
  return async (req, res, next) => {
    try {
      const value = await schema.validateAsync(req.query, {
        allowUnknown: true,
        stripUnknown: true,
      });
      req.query = value;
      next();
    } catch (e) {
      next(new ValidationException(e.details[0].message, e));
    }
  };
};

module.exports = {
  validateBody,
  validateQuery,
  validateObjectId,
};
