const { Router } = require('express');
const { privateRoute } = require('../controllers/test.controller');
const authGuardMiddleware = require('../middleware/authGuard.middleware');

const testRouter = Router();

testRouter.get('/private', authGuardMiddleware, privateRoute);

module.exports = testRouter;
