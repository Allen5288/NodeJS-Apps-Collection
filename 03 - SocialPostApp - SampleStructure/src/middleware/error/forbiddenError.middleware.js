const ForbiddenException = require('../../exceptions/forbidden.exception');
const { logger } = require('../../utils/logger');

const forbiddenErrorHandler = (err, req, res, next) => {
  if (err instanceof ForbiddenException) {
    logger.warn('Forbidden access', {
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

module.exports = forbiddenErrorHandler;
