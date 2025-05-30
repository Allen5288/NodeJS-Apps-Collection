const AppException = require('./app.exception');

class ForbiddenException extends AppException {
  constructor(message, context = {}) {
    super(403, message, context);
  }
}

module.exports = ForbiddenException;
