const express = require("express");
const { getTriageResponse } = require("../controller/triageController");

const router = express.Router();

// Rate limiter — requires express-rate-limit (npm install express-rate-limit)
let apiLimiter;
try {
  const rateLimit = require("express-rate-limit");
  apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { message: "Too many requests. Please wait before trying again." },
  });
} catch {
  // Fallback: no rate limiting if package not installed
  apiLimiter = (req, res, next) => next();
}

// Public — no authMiddleware
router.post("/chat", apiLimiter, getTriageResponse);

module.exports = router;
