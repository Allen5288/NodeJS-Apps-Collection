const morgan = require('morgan');
const { logger } = require('./logger');

module.exports = morgan(process.env.NODE_ENV === 'dev' ? 'dev' : 'combined', {
  stream: {
    write: (message) => logger.info(message),
  },
});
