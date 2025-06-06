// https://bitbucket.org/010001/jr/src/main/
// fill content here
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const articleRoutes = require("./routes/v1/api");
const fileUpload = require('express-fileupload');
const { v4:uuidv4 } = require('uuid');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 5000; // Changed to 5000 to match frontend
const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/cms";

// CORS configuration
const corsOptions = {
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"], // Frontend URLs
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Rate limiting middleware
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per windowMs
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

// Apply rate limiting middleware to all requests
app.use(rateLimiter);

// Body parser middleware
app.use(bodyParser.json());

// FILE UPLOAD MIDDLEWARE - MUST COME BEFORE ROUTES!
app.use(fileUpload({
  createParentPath: true,
  limits: { 
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  abortOnLimit: true,
  responseOnLimit: "File size limit has been reached",
}));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));




// Routes - MUST COME AFTER MIDDLEWARE!
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
