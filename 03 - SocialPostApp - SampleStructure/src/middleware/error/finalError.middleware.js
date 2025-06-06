const { logger } = require('../../utils/logger');

const finalErrorHandler = (err, req, res, next) => {
  logger.error('Unexpected error occurred', {
    error: err,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: 'Something went wrong',
  });
};

module.exports = finalErrorHandler;

// formatResponse
// res.formatResponse(data|error);

/**
 *
 * {
 *    success: true,
 *    data: object | object[]
 * }
 *
 * {
 *    success: false,
 *    error: object | object[]
 * }
 */
