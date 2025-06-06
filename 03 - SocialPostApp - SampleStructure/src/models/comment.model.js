const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: true,
      maxLength: 1000,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

schema.statics.findByIdOrFail = async function (id) {
  const comment = await this.findById(id).exec();
  if (!comment) {
    throw new NotFoundException(`Comment ${id} is not found`);
  }
  return comment;
};

module.exports = mongoose.model('Comment', schema);
