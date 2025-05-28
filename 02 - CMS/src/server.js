// fill content here
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const articleRoutes = require("./routes/v1/api");
const audit = require("./middleware/audit");
const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cms"; // Update with your MongoDB URI

// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 5 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: "draft-8", // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Audit middleware to log requests
app.use(
  audit({
    logLevel: "info",
    includeHeaders: true,
    includeBody: false,
    includeQuery: true,
    includeParams: true,
    includeUserAgent: true,
    includeIP: true,
    includeTimestamp: true,
    excludePaths: ["/health", "/favicon.ico"],
    maxBodyLength: 1000,
  })
);

// Apply rate limiting middleware to all requests
app.use(rateLimiter);

// Middleware
app.use(bodyParser.json());
app.use("/api/v1", articleRoutes);

// Connect to MongoDB
mongoose
  .connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app for testing purposes
module.exports = app;
