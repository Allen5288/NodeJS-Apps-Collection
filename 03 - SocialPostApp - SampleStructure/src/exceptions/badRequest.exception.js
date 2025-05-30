const AppException = require('./app.exception');

class BadRequestException extends AppException {
  constructor(message, context = {}) {
    super(400, message, context);
  }
}

module.exports = BadRequestException;
