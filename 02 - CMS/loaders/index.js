const expressLoader = require("./express"); //ENSURE THIS IS ./
const mongooseLoader = require("./mongoose");

const init = () => {
  const expressApp = expressLoader();
  const dbConnection = mongooseLoader();
  return { expressApp, dbConnection };
};
const { expressApp, dbConnection } = init();

exports.express = expressApp;
exports.dbConnection = dbConnection;

// const user User.find({email})
// user.generateAUthToken()

// User.findBy(email)
