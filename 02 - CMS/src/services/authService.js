const User = require("../model/user");
exports.register = async (req) => {
  const user = new User(req.body);
  try {
    await user.save();
    return { status: 201, body: { message: "User registered successfully", payload: user } };
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
};

exports.login = async (req) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByCredentials(email, password);
    if (!user) {
      return { status: 401, body: { error: "Invalid email or password" } };
    }
    user.generateAuthToken();
    return { status: 200, body: { user } };
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
};

exports.logout = async (req) => {
  try {
    req.user.tokens = req.user.tokens.filter((token) => token !== req.token);
    await req.user.save();
    return { status: 200, body: { message: "Logged out successfully" } };
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
};

exports.showMe = async (req) => {
  try {
    const user = await User.findById(req.user._id).select("-password -__v");
    if (!user) {
      return { status: 404, body: { error: "User not found" } };
    }
    return { status: 200, body: user };
  } catch (error) {
    return { status: 400, body: { error: error.message } };
  }
};
