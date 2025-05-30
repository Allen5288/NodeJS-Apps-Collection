const BadRequestException = require('../../exceptions/badRequest.exception');
const { logger } = require('../../utils/logger');

const badRequestErrorHandler = (err, req, res, next) => {
  if (err instanceof BadRequestException) {
    logger.info('bad reqeust', {
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

module.exports = badRequestErrorHandler;
