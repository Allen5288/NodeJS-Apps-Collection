const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema({
  title: {
    type: String,
    index: true,
  },
  content: {
    type: String,
  },
  comments: [
    {
      type: String,
    },
  ],
  status: { type: String },
  author: { type: String },
  likeBy: [{ type: String }],
}, { 
  timestamps: true  // This adds createdAt and updatedAt fields
});

module.exports = mongoose.model("Article", articleSchema);
