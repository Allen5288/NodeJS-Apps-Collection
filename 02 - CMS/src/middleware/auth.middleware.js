const jwt = require("jsonwebtoken");
const User = require("../model/user");

const app = require("../config/index");

exports.auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: "Unauthorized for authHeader" });
  }
  const authType = authHeader.split(" ")[0];
  const authToken = authHeader.split(" ")[1];

  if (!authHeader || authType !== "Bearer" || !authToken) {
    return res.status(401).json({ error: "Unauthorized for extract" });
  }

  jwt.verify(authToken, app.jwtSecret, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Unauthorized for jwt.verify" });
    }

    try {
      const user = await User.findOne({
        _id: decoded.id,
        token: authToken,
      });
      if (!user) {
        return res.status(401).json({ error: "Unauthorized for user" });
      }
      req.headers.userId = user._id;
      return next();
    } catch (error) {
      return res.status(500).json({ error: "Internal server error" });
    }
  });
};
