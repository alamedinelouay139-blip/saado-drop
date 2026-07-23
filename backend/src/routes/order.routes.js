/**
 * Order routes.
 * 
 * Note: These are for public customer facing order creation.
 * Admin order management will be in admin-order.routes.js
 */
const express = require('express');
const orderController = require('../controllers/order.controller');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

// Public route to submit an order
router.post('/', asyncHandler(orderController.createOrder));

module.exports = router;
