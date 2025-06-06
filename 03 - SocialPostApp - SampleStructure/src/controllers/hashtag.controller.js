const Hashtag = require('../models/hashtag.model');

// GET /v1/hashtags/popular
// GET /v1/hashtags/trending
// GET /v1/hashtags?type=xxxx
const getPopularHashtags = async (req, res, next) => {
  try {
    const { limit, page } = req.query;

    const hashtags = await Hashtag.find()
      .sort({ postsCount: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'recentPosts',
        select: 'title content createdAt',
        populate: {
          path: 'user',
          select: 'username',
        },
      })
      .exec();

    res.json({
      success: true,
      data: hashtags,
    });
  } catch (e) {
    next(e);
  }
};

// const getTrendingHashtags = () => {}

module.exports = {
  getPopularHashtags,
};
