const express = require('express')
const router = express.Router()
const rateLimit = require('express-rate-limit')
const {getAiResponse  } = require('../controller/aiController');


const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes (Milliseconds mein)
    max: 100, // Har IP se sirf 100 requests allowed
    message: {
        message: "Bas bhai! Bohot sawal puch liye. Thodi der baad aana."
    },
    standardHeaders: true, // Browser ko batao ki limit kya hai
    legacyHeaders: false,
});

router.post('/ask', apiLimiter, getAiResponse); 

module.exports = router;