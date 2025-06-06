const ConflictException = require('../exceptions/conflict.exception');
const User = require('../models/user.model');
const { generateToken } = require('../utils/jwt');
const { createLogger } = require('../utils/logger');
const logger = createLogger(__filename);
const Joi = require('joi');

const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username }).exec();
    if (!user) {
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const valid = await user.comparePassword(password);
    if (!valid) {
      // fail fast
      res.status(401).json({ error: 'invalid credentials' });
      return;
    }
    const token = generateToken({ _id: user._id, username: user.username });
    res.json({ success: true, data: { token } });
  } catch (e) {
    next(e);
  }
  // next(error);
};

const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (await User.findOne({ username })) {
      throw new ConflictException('Username already exists', { username });
    }

    // mongoose document object
    const user = new User({ username, password });
    // validation - mongoose (save())
    await user.hashPassword();

    // try {
    await user.save();
    // } catch(e) {
    // }

    const token = generateToken({ _id: user._id, username: user.username });
    res.json({ success: true, data: { token } });
  } catch (e) {
    next(e);
  }
  // send email
  // user : {verified: boolean, email: string}
};

module.exports = {
  login,
  register,
};

// curry function - high order function
// const catchAllErrors = (routeHandler) => {
//   return async (req, res,next) => {
//     try {
//       await routeHandler(req,res,next)
//     } catch(e) {
//       next(e);
//     }
//   }
// }
// app.use('/v1/auth/login', catchAllErrors(login));
// app.use('/v1/auth/register', catchAllErrors(register));
// express-async-errors

/**
 *
 * 1. try..catch
 *
 *    try {
 *      await xxxx
 *    } catch (e) {
 *      next(e);
 *    }
 * 2. async await -> promise syntax sugar
 *
 *  User.findOne().exec().then().catch((e)=>next(e));
 *
 * 3. callback
 * User.findOne().exec((err, user)=>{
 *    if (err) {
 *      next(err);
 *      return;
 *    }
 *    // handle user
 * })
 */
