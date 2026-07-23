/**
 * Customer Order controller.
 */
const orderService = require('../services/order.service');
const { validateCustomerOrder } = require('../validators/order.validator');

/**
 * POST /api/orders
 * Public - submit a new customer order.
 */
const createOrder = async (req, res) => {
  const validation = validateCustomerOrder(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  try {
    const result = await orderService.createCustomerOrder(validation.data);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result,
    });
  } catch (error) {
    // Re-throw to be handled by errorMiddleware
    throw error;
  }
};

module.exports = {
  createOrder,
};
