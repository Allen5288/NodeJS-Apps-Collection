class AppException extends Error {
  constructor(statusCode = 500, message, context = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.context = {
      ...context,
      // timestamp: Date.now().toString()
    };
  }
}

module.exports = AppException;

// new Error('xxxx');
