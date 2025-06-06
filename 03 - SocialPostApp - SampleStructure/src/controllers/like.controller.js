const Like = require('../models/like.model');
const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const BadRequestException = require('../exceptions/badRequest.exception');
const ConflictException = require('../exceptions/conflict.exception');
const NotFoundException = require('../exceptions/notFound.exception');
const ForbiddenException = require('../exceptions/forbidden.exception');

const createLike = async (req, res, next) => {
  try {
    const { targetType, targetId, postId } = req.body;
    const Model = targetType === 'Post' ? Post : Comment;
    const target = await Model.findByIdOrFail(targetId);

    if (targetType === 'Comment' && target.post.toString() !== postId) {
      throw new BadRequestException('Comment does not belong to the post');
    }

    if (targetType === 'Post' && targetId !== postId) {
      throw new BadRequestException('post id mismatch');
    }

    const userId = req.user._id;

    const exisitingLike = await Like.findOne({
      user: userId,
      target: targetId,
      targetType,
    });

    if (exisitingLike) {
      // res.json({success:true}) PUT -> upsert

      // POST
      throw new ConflictException('Like already exists');
    }

    const like = new Like({
      user: userId,
      target: targetId,
      targetType,
      post: postId,
    });

    await like.save();

    await Model.findByIdAndUpdate(targetId, { $inc: { likesCount: 1 } });
    res.status(201).json({ success: true, data: like });
  } catch (e) {
    next(e);
  }
};

const deleteLikeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    // user ownership
    // Like.findOne({
    //   user: req.user._id,
    //   _id: id
    // })
    const like = await Like.findById(id).exec();
    if (!like) {
      throw new NotFoundException('Like not found');
    }
    if (like.user.toString() !== req.user._id) {
      throw new ForbiddenException('Action now allowed');
    }
    await like.deleteOne();

    const Model = like.targetType === 'Post' ? Post : Comment;
    await Model.findByIdAndUpdate(like.target, { $inc: { likesCount: -1 } });
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
};

// GET /likes?postId=xxxx
// GET /posts/:postId/likes/me
// GET /users/me

module.exports = {
  createLike,
  deleteLikeById,
};
