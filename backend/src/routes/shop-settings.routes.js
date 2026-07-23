/**
 * Shop Settings routes.
 */
const express = require('express');
const shopSettingsController = require('../controllers/shop-settings.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

// Public route to get settings
router.get('/', asyncHandler(shopSettingsController.getSettings));

// Protected route to update settings
router.patch('/', authMiddleware, asyncHandler(shopSettingsController.updateSettings));

module.exports = router;
