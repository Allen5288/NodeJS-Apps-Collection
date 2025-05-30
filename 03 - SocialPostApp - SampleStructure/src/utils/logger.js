const winston = require('winston');
const path = require('path');

// __filename
const createLogger = (filename) => {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: {
      file: filename ? path.basename(filename) : undefined,
    },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(
        ({ timestamp, level, message, file, error, path, method }) => {
          const fileInfo = file ? ` [${file}]` : '';
          const requestInfo = path && method ? ` [${method} ${path}]` : '';
          // error -> stack trace
          const stack = error?.stack;
          // error.context?
          const contextInfo = error ? `\n${JSON.stringify(error.context)}` : '';
          const stackTrace = stack ? `\n${stack}` : '';
          return `[${timestamp}]${fileInfo}${requestInfo} [${level}]: ${message}${contextInfo}${stackTrace}`;
        }
      )
    ),
    transports: [
      new winston.transports.Console(),
      new winston.transports.File({ filename: 'logs/combined.log' }),
      new winston.transports.File({
        level: 'error',
        filename: 'logs/error.log',
      }),
    ],
  });

  return logger;
};

module.exports = { createLogger, logger: createLogger() };
