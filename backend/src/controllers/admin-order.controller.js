/**
 * Admin Order controller.
 */
const adminOrderService = require('../services/admin-order.service');
const authService = require('../services/auth.service');
const bcrypt = require('bcrypt');

const VALID_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];

/**
 * GET /api/admin/orders
 * Protected - Get list of orders.
 */
const getOrders = async (req, res) => {
  const { status, order_type, page, limit } = req.query;
  const filters = {};

  if (status) {
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'status', message: 'Invalid status filter' }] });
    }
    filters.status = status;
  }
  
  if (order_type) {
    if (!['delivery', 'pickup'].includes(order_type)) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'order_type', message: 'Invalid order_type filter' }] });
    }
    filters.order_type = order_type;
  }

  if (page) filters.page = page;
  if (limit) filters.limit = limit;

  const result = await adminOrderService.getOrders(filters);

  res.status(200).json({
    success: true,
    message: 'Orders retrieved successfully',
    data: result,
  });
};

/**
 * GET /api/admin/orders/:id
 * Protected - Get full order details.
 */
const getOrderDetails = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'id', message: 'Invalid order ID' }] });
  }

  const order = await adminOrderService.getOrderDetails(id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Order retrieved successfully',
    data: order,
  });
};

/**
 * PATCH /api/admin/orders/:id/status
 * Protected - Update order status.
 */
const updateOrderStatus = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'id', message: 'Invalid order ID' }] });
  }

  const { status: newStatus } = req.body;
  if (!newStatus || !VALID_STATUSES.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` }]
    });
  }

  const existingOrder = await adminOrderService.getOrderDetails(id);
  if (!existingOrder) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  const currentStatus = (existingOrder.status || '').toLowerCase();
  
  // Define allowed transitions
  const allowedTransitions = {
    'pending': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready', 'cancelled'],
    'ready': ['completed', 'cancelled'],
    'completed': [],
    'cancelled': []
  };

  const allowedNext = allowedTransitions[currentStatus] || [];

  if (currentStatus !== newStatus && !allowedNext.includes(newStatus)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status transition',
      errors: [{ field: 'status', message: `Cannot transition from ${currentStatus} to ${newStatus}` }]
    });
  }

  try {
    const updated = await adminOrderService.updateOrderStatus(id, newStatus);
    
    res.status(200).json({
      success: true,
      message: 'Order status updated successfully',
      data: updated,
    });
  } catch (err) {
    console.error('Error in updateOrderStatus controller:', err);
    throw err;
  }
};

/**
 * GET /api/admin/orders/:id/whatsapp-message
 * Protected - Get a WhatsApp formatted string for the order.
 */
const getWhatsAppMessage = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'id', message: 'Invalid order ID' }] });
  }

  const messageStr = await adminOrderService.generateWhatsAppMessage(id);
  if (!messageStr) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.status(200).json({
    success: true,
    message: 'WhatsApp message generated successfully',
    data: {
      message: messageStr
    },
  });
};

/**
 * GET /api/admin/orders/export
 * Protected - Export all orders as JSON.
 */
const exportOrders = async (req, res) => {
  try {
    const data = await adminOrderService.exportAllOrders();
    res.setHeader('Content-Disposition', 'attachment; filename=orders-export.json');
    res.setHeader('Content-Type', 'application/json');
    res.status(200).send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error in exportOrders:', err);
    res.status(500).json({ success: false, message: 'Failed to export orders' });
  }
};

/**
 * DELETE /api/admin/orders/:id
 * Protected - Permanently delete a single order.
 */
const deleteOneOrder = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: [{ field: 'id', message: 'Invalid order ID' }] });
  }

  const deleted = await adminOrderService.deleteOneOrder(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Order deleted permanently.',
  });
};

/**
 * DELETE /api/admin/orders
 * Protected - Permanently delete all orders (Danger Zone).
 */
const deleteAllOrders = async (req, res) => {
  const { current_password, confirmation } = req.body;

  if (confirmation !== 'DELETE ALL ORDERS') {
    return res.status(400).json({
      success: false,
      message: 'Invalid confirmation phrase'
    });
  }

  if (!current_password) {
    return res.status(401).json({
      success: false,
      message: 'Password required'
    });
  }

  const admin = await authService.getAdminByIdForAuthentication(req.admin.id);
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Admin not found' });
  }

  const isPasswordValid = await bcrypt.compare(current_password, admin.password_hash);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid password' });
  }

  const result = await adminOrderService.deleteAllOrders();

  res.status(200).json({
    success: true,
    message: 'All orders were deleted permanently.',
    data: result
  });
};

module.exports = {
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  getWhatsAppMessage,
  exportOrders,
  deleteOneOrder,
  deleteAllOrders,
};
