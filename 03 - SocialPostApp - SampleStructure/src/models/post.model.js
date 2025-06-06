const mongoose = require('mongoose');

// 255
const schema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 100,
      trim: true,
    },
    content: {
      type: String,
      required: true,
      // default: 'xxxx',
      maxLength: 1000,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hashtags: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Hashtag',
      },
    ],
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// text index
schema.index({
  title: 'text',
  content: 'text',
});

// Post.findByIdOrFail
schema.statics.findByIdOrFail = async function (id) {
  const post = await this.findById(id).exec();
  if (!post) {
    throw new NotFoundException(`Post ${id} is not found`);
  }
  return post;
};

module.exports = mongoose.model('Post', schema);
