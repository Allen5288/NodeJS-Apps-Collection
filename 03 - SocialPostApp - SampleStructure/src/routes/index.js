const { Router } = require('express');
const authRouter = require('./auth.router');
const postRouter = require('./post.router');
const commentRouter = require('./comment.router');
const hashtagRouter = require('./hashtag.router');
const likeRouter = require('./like.router');

const v1Router = Router();

v1Router.use('/auth', authRouter);
v1Router.use('/posts', postRouter);
v1Router.use('/comments', commentRouter);
v1Router.use('/hashtags', hashtagRouter);
v1Router.use('/likes', likeRouter);

module.exports = v1Router;
