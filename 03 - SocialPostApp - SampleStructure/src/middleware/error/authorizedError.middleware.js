const UnauthorizedException = require('../../exceptions/unauthorized.exception');
const { logger } = require('../../utils/logger');

const unauthorizedErrorHandler = (err, req, res, next) => {
  if (err instanceof UnauthorizedException) {
    logger.info('unauthorized access', {
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

module.exports = unauthorizedErrorHandler;
