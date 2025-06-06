const ConflictException = require('../../exceptions/conflict.exception');
const { logger } = require('../../utils/logger');

const conflictErrorHandler = (err, req, res, next) => {
  if (err instanceof ConflictException) {
    logger.info('resource conflict', {
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

module.exports = conflictErrorHandler;
