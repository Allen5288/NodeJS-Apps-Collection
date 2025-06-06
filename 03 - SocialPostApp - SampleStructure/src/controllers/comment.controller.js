const Post = require('../models/post.model');
const Comment = require('../models/comment.model');

const createComment = async (req, res, next) => {
  const { content, post: postId } = req.body;
  try {
    const post = await Post.findByIdOrFail(postId);
    const comment = new Comment({
      content,
      post: post._id,
      user: req.user._id,
    });
    await comment.save();
    // TODO: increment post's comment count
    res.status(201).json({ success: true, data: comment });
  } catch (e) {
    next(e);
  }
};
const updateCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdOrFail(req.params.id);
    checkUserOwnsComment(comment, req.user._id);
    comment.set(req.body);
    await comment.save();
    res.json({
      success: true,
      data: comment,
    });
  } catch (e) {
    next(e);
  }
};
// /comments/:id
const deleteCommentById = async (req, res, next) => {
  try {
    const comment = await Comment.findByIdOrFail(req.params.id);
    checkUserOwnsComment(comment, req.user._id);
    await comment.deleteOne();
    // TODO: reduce comments count
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
};
const getCommentsByPostId = async (req, res, next) => {
  const { postId, page, limit } = req.query;
  try {
    await Post.findByIdOrFail(postId);
    const comments = await Comment.find({ post: postId })
      .populate('user', 'username')
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
    res.json({
      success: true,
      data: comments,
    });
  } catch (e) {
    next(e);
  }
};

const checkUserOwnsComment = (comment, userId) => {
  if (userId !== comment.user.toString()) {
    throw new ForbiddenException(
      'You do not have permission to perform this action'
    );
  }
};

module.exports = {
  createComment,
  getCommentsByPostId,
  updateCommentById,
  deleteCommentById,
};
