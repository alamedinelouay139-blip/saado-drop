/**
 * Auth routes.
 */
const express = require('express');
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const loginRateLimiter = require('../middleware/login-rate-limit.middleware');
const passwordRateLimiter = require('../middleware/password-rate-limit.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

// Public route for login, rate-limited
router.post('/login', loginRateLimiter, asyncHandler(authController.login));

// Protected route to get own profile
router.get('/profile', authMiddleware, asyncHandler(authController.getProfile));

// Protected route to change password
router.patch('/password', authMiddleware, passwordRateLimiter, asyncHandler(authController.changePassword));

module.exports = router;
