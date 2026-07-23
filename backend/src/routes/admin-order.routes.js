/**
 * Admin Order routes.
 */
const express = require('express');
const adminOrderController = require('../controllers/admin-order.controller');
const authMiddleware = require('../middleware/auth.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

// All admin order routes are protected
router.use(authMiddleware);

router.get('/', asyncHandler(adminOrderController.getOrders));
router.get('/export', asyncHandler(adminOrderController.exportOrders));
router.get('/:id', asyncHandler(adminOrderController.getOrderDetails));
router.patch('/:id/status', asyncHandler(adminOrderController.updateOrderStatus));
router.get('/:id/whatsapp-message', asyncHandler(adminOrderController.getWhatsAppMessage));
router.delete('/:id', asyncHandler(adminOrderController.deleteOneOrder));
router.delete('/', asyncHandler(adminOrderController.deleteAllOrders));

module.exports = router;
