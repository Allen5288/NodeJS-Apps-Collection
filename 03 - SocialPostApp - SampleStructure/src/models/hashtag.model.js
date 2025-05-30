const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    // _id => name, alias
    name: {
      type: String,
      required: true,
      unique: true,
      // a-zA-Z0-9_
      match: [
        /^[a-zA-Z0-9_]+$/,
        'Hashtag can only contain letters, number and underscore',
      ],
    },
    postsCount: {
      type: Number,
      default: 0,
    },
    // MAX 10 posts
    recentPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MAX_RECENT_POSTS = 2;
// Hashtag.createOrUpdateHashtagByName
schema.statics.createOrUpdateHashtagByName = async function (name, postId) {
  return this.findOneAndUpdate(
    { name },
    {
      $push: {
        recentPosts: {
          // update operator
          $each: [postId],
          $slice: -MAX_RECENT_POSTS,
        },
      },
      $inc: { postsCount: 1 },
    },
    {
      upsert: true,
      new: true,
    }
  );
};

module.exports = mongoose.model('Hashtag', schema);
