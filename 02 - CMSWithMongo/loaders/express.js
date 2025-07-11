const express = require("express");
const cors = require("cors");
//comments out two lines below
const apiRouter = require("../src/routes/v1/api");
const config = require("../src/config");
const rateLimit = require("express-rate-limit");
const audit = require("express-requests-logger");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Redis, Memcached, etc. See below.
});

const startServer = () => {
  const expressApplication = express();
  //CHANGE TO 8000
  expressApplication.listen(config.port, (err) => {
    if (err) {
      console.log(err);
      process.exit(1);
    }
    console.log("SERVER STARTED:", config.port);
  });
  return expressApplication;
};

module.exports = () => {
  const app = startServer();
  app.use(cors());
  app.use(express.json());
  // app.use(limiter);
  // app.use(
  //   audit({
  //     logger: logger, // Existing bunyan logger
  //     excludeURLs: ["health", "metrics"], // Exclude paths which enclude 'health' & 'metrics'
  //     request: {
  //       maskBody: ["password"], // Mask 'password' field in incoming requests
  //       excludeHeaders: ["authorization"], // Exclude 'authorization' header from requests
  //       excludeBody: ["creditCard"], // Exclude 'creditCard' field from requests body
  //       maskHeaders: ["header1"], // Mask 'header1' header in incoming requests
  //       maxBodyLength: 50, // limit length to 50 chars + '...'
  //     },
  //     response: {
  //       maskBody: ["session_token"], // Mask 'session_token' field in response body
  //       excludeHeaders: ["*"], // Exclude all headers from responses,
  //       excludeBody: ["*"], // Exclude all body from responses
  //       maskHeaders: ["header1"], // Mask 'header1' header in incoming requests
  //       maxBodyLength: 50, // limit length to 50 chars + '...'
  //     },
  //     shouldSkipAuditFunc: function (req, res) {
  //       // Custom logic here.. i.e: return res.statusCode === 200
  //       return false;
  //     },
  //   })
  // );
  //api/v1 + route name
  app.use(config.api.prefix, apiRouter); // this get code from app/route/api/v1/api.js code
  return app;
};
