const morgan = require('morgan');

module.exports = morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined');
