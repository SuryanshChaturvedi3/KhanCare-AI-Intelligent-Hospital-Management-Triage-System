const router = require('express').Router();
const authController = require('../controller/authController');

// Rate limiter — 20 auth attempts per 15 min per IP (brute-force protection)
let authLimiter;
try {
  const rateLimit = require("express-rate-limit");
  authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { message: "Too many attempts. Please wait 15 minutes." },
  });
} catch {
  authLimiter = (req, res, next) => next();
}

router.post('/register', authLimiter, authController.registerUser);
router.post('/login', authLimiter, authController.loginUser);

module.exports = router;
