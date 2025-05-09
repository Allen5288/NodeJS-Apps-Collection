const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `[${timestamp}] [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.File({ level: 'error', filename: 'logs/error.log' }),
  ],
});

module.exports = { logger };
