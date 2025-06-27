const dotenv = require("dotenv");
dotenv.config(); //This load the .env file to our env
process.env.NODE_ENV = process.env.NODE_ENV ?? "dev";

module.exports = {
  port: process.env.PORT || 8000,
  api: {
    prefix: process.env.API_PREFIX || "/api/v1",
  },
  dbConnection: process.env.MONGODB_URL,
  jwtSecret: process.env.JWT_SECRET,
};
