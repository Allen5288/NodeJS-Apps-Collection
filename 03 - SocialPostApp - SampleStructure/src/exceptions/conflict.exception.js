const AppException = require('./app.exception');

class ConflictException extends AppException {
  constructor(message, context = {}) {
    super(409, message, context);
  }
}

module.exports = ConflictException;
