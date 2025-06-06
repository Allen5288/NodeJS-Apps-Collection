const { validateToken } = require('../utils/jwt');

module.exports = (req, res, next) => {
  const authorization = req.header('Authorization');
  if (!authorization) {
    res.status(401).json({ error: 'missing auth header' });
    return;
  }

  // Bearer token
  const [type, token] = authorization.split(' ');
  if (type !== 'Bearer' || !token) {
    // fail fast
    res.status(401).json({ error: 'invalid token type' });
    return;
  }

  try {
    const payload = validateToken(token);
    req.user = payload;
  } catch (e) {
    next(e);
  }
  next();
};
