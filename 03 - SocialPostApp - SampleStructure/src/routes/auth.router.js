const { Router } = require('express');
const { login, register } = require('../controllers/auth.controller');
const { validateBody } = require('../middleware/validation.middleware');
const authValidationSchema = require('../validations/auth.validation');

const authRouter = Router();

authRouter.post('/login', validateBody(authValidationSchema.login), login);
authRouter.post(
  '/register',
  validateBody(authValidationSchema.register),
  register
);

module.exports = authRouter;
