const NotFoundException = require('../../exceptions/notFound.exception');
const { logger } = require('../../utils/logger');

const notFoundErrorHandler = (err, req, res, next) => {
  if (err instanceof NotFoundException) {
    logger.info('resource not found', {
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

module.exports = notFoundErrorHandler;
