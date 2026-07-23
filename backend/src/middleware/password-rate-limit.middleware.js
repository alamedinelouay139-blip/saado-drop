const rateLimit = require('express-rate-limit');

/**
 * Rate limiter specific to the change password endpoint.
 * Max 5 attempts per 15 minutes per IP.
 */
const passwordRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many password change attempts. Please try again later.'
    });
  }
});

module.exports = passwordRateLimiter;
