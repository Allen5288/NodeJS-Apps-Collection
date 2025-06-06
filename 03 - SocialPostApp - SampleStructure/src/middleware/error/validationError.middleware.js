const ValidationException = require('../../exceptions/validation.exception');
const { logger } = require('../../utils/logger');

const validationErrorHandler = (err, req, res, next) => {
  if (err.name === 'ValidationError') {
    logger.warn('Mongoose validation error', {
      error: err,
      path: req.path,
      method: req.method,
    });
    return res.status(400).json({
      success: false,
      error: err.message,
    });
  }

  if (err instanceof ValidationException) {
    logger.info('Joi validation error', {
      error: err,
      path: req.path,
      method: req.method,
    });
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }
  next(err);
};

module.exports = validationErrorHandler;
