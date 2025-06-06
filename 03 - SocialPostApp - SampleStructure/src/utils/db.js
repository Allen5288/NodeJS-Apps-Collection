const mongoose = require('mongoose');
const config = require('./config');

const connectToDb = async () => {
  const db = mongoose.connection;
  db.on('connecting', () => {
    console.log('Attempting to connect to db');
  });
  db.on('connected', () => {
    console.log('Db connected successfully');
  });
  db.on('disconnected', () => {
    console.log('Db connection lost');
  });
  db.on('reconnected', () => {
    console.log('Db reconnected successfully');
  });
  db.on('error', (error) => {
    console.error('Db connection error', error);
    // 0 -> normal exit
    // non 0 -> error exit
    process.exit(1);
  });
  mongoose.connect(config.DB_CONNECTION_STRING, {
    serverSelectionTimeoutMS: 5000,
  });
};

module.exports = connectToDb;
