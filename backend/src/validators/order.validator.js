/**
 * Order validator.
 */
const validateCustomerOrder = (body) => {
  const errors = [];
  const data = {};

  // customer_name
  if (typeof body.customer_name !== 'string' || body.customer_name.trim().length === 0) {
    errors.push({ field: 'customer_name', message: 'Customer name is required' });
  } else {
    data.customer_name = body.customer_name.trim();
  }

  // customer_phone
  if (typeof body.customer_phone !== 'string' || body.customer_phone.trim().length === 0) {
    errors.push({ field: 'customer_phone', message: 'Customer phone is required' });
  } else {
    data.customer_phone = body.customer_phone.trim();
  }

  // order_type
  if (!['delivery', 'pickup'].includes(body.order_type)) {
    errors.push({ field: 'order_type', message: 'Order type must be delivery or pickup' });
  } else {
    data.order_type = body.order_type;
  }

  // delivery_address
  if (data.order_type === 'delivery') {
    if (typeof body.delivery_address !== 'string' || body.delivery_address.trim().length === 0) {
      errors.push({ field: 'delivery_address', message: 'Delivery address is required for delivery orders' });
    } else {
      data.delivery_address = body.delivery_address.trim();
    }
  } else {
    data.delivery_address = null;
  }

  // customer_notes
  if (body.customer_notes !== undefined) {
    data.customer_notes = typeof body.customer_notes === 'string' ? body.customer_notes.trim() : null;
  } else {
    data.customer_notes = null;
  }

  // items
  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push({ field: 'items', message: 'Order must contain at least one item' });
  } else {
    const items = [];
    const productIds = new Set();

    for (let i = 0; i < body.items.length; i++) {
      const item = body.items[i];
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (!Number.isInteger(productId) || productId <= 0) {
        errors.push({ field: `items[${i}].product_id`, message: 'Invalid product ID' });
        continue;
      }
      
      if (!Number.isInteger(quantity) || quantity <= 0) {
        errors.push({ field: `items[${i}].quantity`, message: 'Quantity must be a positive integer' });
        continue;
      }

      // Merge duplicate product IDs by adding quantities
      if (productIds.has(productId)) {
        const existingItem = items.find(i => i.product_id === productId);
        existingItem.quantity += quantity;
      } else {
        productIds.add(productId);
        items.push({ product_id: productId, quantity });
      }
    }
    
    if (items.length > 0) {
      data.items = items;
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
};

module.exports = {
  validateCustomerOrder,
};
