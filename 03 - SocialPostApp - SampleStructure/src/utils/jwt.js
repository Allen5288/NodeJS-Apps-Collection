const jwt = require('jsonwebtoken');
const config = require('./config');
const UnauthorizedException = require('../exceptions/unauthorized.exception');

const generateToken = (payload) => {
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '1d' });
};

const validateToken = (token) => {
  try {
    const payload = jwt.verify(token, config.JWT_SECRET);
    return payload;
  } catch (e) {
    throw new UnauthorizedException('Invalid token');
  }
};

module.exports = {
  generateToken,
  validateToken,
};
