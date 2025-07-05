import arcjet, { tokenBucket, shield, detectBot } from "@arcjet/node";

import dotenv from "dotenv";
dotenv.config();

// init arcjet
// example of token usage:
// - `refillRate`: 5 tokens per 10 seconds
// - `interval`: 10 seconds
// - `capacity`: 10 tokens maximum
// - `requested`: 1 token per request
export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["ip.src"],
  rules: [
    shield({ mode: "LIVE" }), // Enable shield mode for live protection
    detectBot({
      mode: "LIVE", // Enable bot detection in live mode
      allow: [
        "CATEGORY:SEARCH_ENGINE",
        // see full list of categories at https://docs.arcjet.io/docs/bot-detection#categories
      ],
    }),
    tokenBucket({
      mode: "LIVE", // Enable token bucket rate limiting in live mode
      refillRate: 5, // Tokens added per interval
      interval: 10, // Interval in milliseconds
      capacity: 10, // Maximum tokens allowed
    }),
  ],
});
