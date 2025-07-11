const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  token: {
    type: String,
    default: null,
  },
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = this;
  return await bcrypt.compare(candidatePassword, user.password);
};

userSchema.methods.toJSON = function () {
  const user = this;
  const userObject = user.toObject();

  // Remove sensitive information
  delete userObject.password;

  return userObject;
};

// static here is used to define a method that can be called on the model itself, rather than on instances of the model.
userSchema.statics.findByCredentials = async function (email, password) {
  const User = this;
  const user = await User.findOne({ email });

  if (!user) {
    throw new Error("User not found");
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error("Invalid credentials");
  }

  return user;
};

userSchema.methods.generateAuthToken = function () {
  const user = this;
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
  user.token = token;
  user.save(); // Save the token to the user document
  return token;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
