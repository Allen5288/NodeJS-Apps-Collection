const AppException = require('./app.exception');

class UnauthorizedException extends AppException {
  constructor(message, context = {}) {
    super(401, message, context);
  }
}

module.exports = UnauthorizedException;
