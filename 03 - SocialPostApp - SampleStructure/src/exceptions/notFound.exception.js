const AppException = require('./app.exception');

class NotFoundException extends AppException {
  constructor(message, context = {}) {
    super(404, message, context);
  }
}

module.exports = NotFoundException;
