const mongoose = require("mongoose");
const config = require("../app/config/index");

module.exports = async () => {
  const connection = await mongoose.connect(config.dbConnection);
  return connection.connection.db;
};
