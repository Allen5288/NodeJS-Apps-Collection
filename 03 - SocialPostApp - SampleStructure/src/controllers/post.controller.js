const ForbiddenException = require('../exceptions/forbidden.exception');
const NotFoundException = require('../exceptions/notFound.exception');
const Hashtag = require('../models/hashtag.model');
const Post = require('../models/post.model');
const Like = require('../models/like.model');

const createPost = async (req, res, next) => {
  try {
    // if (!req.user) {
    //   throw xxx
    // }
    const { title, content } = req.body;
    // Post.create()
    const post = new Post({
      // ...req.body,
      title,
      content,
      user: req.user._id,
    });
    // transaction
    const hashtags = extractHashtags(content);
    if (hashtags.length > 0) {
      const hashtagDocs = await Promise.all(
        hashtags.map((h) => Hashtag.createOrUpdateHashtagByName(h, post._id))
      );
      post.hashtags = hashtagDocs.map((doc) => doc._id);
    }
    await post.save();
    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (e) {
    next(e);
  }
};

const getAllPosts = async (req, res, next) => {
  const { limit, page, q } = req.query;
  const searchQuery = q ? { $text: { $search: q } } : {};
  try {
    const posts = await Post.find(searchQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
    // const total = await Post.countDocuments(searchQuery).exec();
    res.json({
      success: true,
      data: posts,
      // pagination: {page, limit, total, totalPage}
    });
  } catch (e) {
    next(e);
  }
};
const getPostById = async (req, res, next) => {
  try {
    // const post = await Post.findById(req.params.id)
    //   .populate('user', 'username')
    //   .exec();
    // if (!post) {
    //   throw new NotFoundException(`Post not found ${req.params.id}`);
    // }
    const post = await Post.findByIdOrFail(req.params.id);
    await post.populate('user', 'username');
    res.json({
      success: true,
      data: post,
    });
  } catch (e) {
    next(e);
  }
};
const updatePostById = async (req, res, next) => {
  try {
    const post = await Post.findByIdOrFail(req.params.id);
    checkUserOwnsPost(post, req.user._id);

    const newHashtags = extractHashtags(req.body.content);
    // compare new and old
    await post.populate('hashtags');
    const oldHashtags = post.hashtags.map(({ name }) => name);
    const { addedHashTags, removedHashTags } = getHashtagsDiff(
      oldHashtags,
      newHashtags
    );

    if (addedHashTags.length > 0 || removedHashTags.length > 0) {
      const addedHashTagDocs =
        addedHashTags.length > 0
          ? await Promise.all(
              addedHashTags.map((tag) =>
                Hashtag.createOrUpdateHashtagByName(tag, post._id)
              )
            )
          : [];

      if (removedHashTags.length > 0) {
        const removedHashTagIds = post.hashtags
          .filter((tag) => removedHashTags.includes(tag.name))
          .map((tag) => tag._id);

        await Hashtag.updateMany(
          {
            _id: { $in: removedHashTagIds },
          },
          {
            $pull: {
              recentPosts: post._id,
            },
            $inc: { postsCount: -1 },
          }
        ).exec();
      }

      // remaining = old - removed
      const remainingHashtags = post.hashtags
        .filter((tag) => !removedHashTags.includes(tag.name))
        .map((tag) => tag._id);

      post.hashtags = [
        ...addedHashTagDocs.map((doc) => doc._id),
        ...remainingHashtags,
      ];
    }

    post.set(req.body);
    await post.save();
    res.json({
      success: true,
      data: post,
    });
  } catch (e) {
    next(e);
  }
};
const deletePostById = async (req, res, next) => {
  try {
    const post = await Post.findByIdOrFail(req.params.id);
    checkUserOwnsPost(post, req.user._id);
    // better extrac to static method
    await Hashtag.updateMany(
      {
        _id: { $in: post.hashtags },
      },
      {
        $pull: {
          recentPosts: post._id,
        },
        $inc: { postsCount: -1 },
      }
    ).exec();
    await post.deleteOne();
    res.sendStatus(204);
  } catch (e) {
    next(e);
  }
};

const checkUserOwnsPost = (post, userId) => {
  if (userId !== post.user.toString()) {
    throw new ForbiddenException(
      'You do not have permission to perform this action'
    );
  }
};

const extractHashtags = (content) => {
  // [#hi, #hi]
  const hashtags = content.match(/#[a-zA-Z0-9_]+/g) || [];
  return [...new Set(hashtags.map((h) => h.slice(1)))];
};

// ['hi', 'test'] => ['hello', 'example']
// ['hi', 'test', 'hello', 'example']
const getHashtagsDiff = (oldHashtags, newHashtags) => {
  const oldHashtagsSet = new Set(oldHashtags);
  const newHashtagsSet = new Set(newHashtags);
  const addedHashTags = newHashtags.filter((tag) => !oldHashtagsSet.has(tag));
  const removedHashTags = oldHashtags.filter((tag) => !newHashtagsSet.has(tag));
  return {
    addedHashTags,
    removedHashTags,
  };
};

const getUserPostLikes = async (req, res, next) => {
  try {
    const { postId } = req.params;

    const postLikes = await Like.find({
      user: req.user._id,
      post: postId,
    })
      .select('target targetType')
      .exec();

    let postLike = null;
    const commentLikes = [];
    postLikes.forEach((like) => {
      if (like.targetType === 'Post') {
        postLike = like;
      } else {
        commentLikes.push(like);
      }
    });

    const data = {
      post: postLike,
      comments: commentLikes,
    };

    res.json({ success: true, data });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getPostById,
  updatePostById,
  deletePostById,
  getUserPostLikes,
};

// ts
// SSG, SSR, CSR
// webhook - api hook - lambda func - serverless function
// ts - decoration
// dependency injection

// module (angular)
// pipe, transformer
// lifecycle

// user post

// Next.js -> fullstack

// aws console
