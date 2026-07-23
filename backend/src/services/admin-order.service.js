/**
 * Admin Order service.
 */
const { query, pool } = require('../database/pool');

/**
 * Get a list of orders (without items) for the admin dashboard.
 * Supports basic filtering.
 */
const getOrders = async (filters = {}) => {
  let whereSql = 'WHERE 1=1';
  const params = [];

  if (filters.status) {
    whereSql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.order_type) {
    whereSql += ' AND order_type = ?';
    params.push(filters.order_type);
  }

  // Count total rows
  const countRows = await query(`SELECT COUNT(*) as total FROM orders ${whereSql}`, params);
  const total = Number(countRows[0].total);

  // Pagination
  const page = Math.max(1, Number(filters.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(filters.limit) || 20));
  const offset = (page - 1) * limit;

  const dataSql = `SELECT id, order_number, customer_name, customer_phone, order_type, subtotal, status, created_at FROM orders ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`;
  const dataParams = [...params, limit, offset];
  
  const rawItems = await query(dataSql, dataParams);
  const items = rawItems.map(row => ({
    ...row,
    id: Number(row.id)
  }));
  
  return {
    items,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit)
    }
  };
};

/**
 * Get full order details, including order items and joined product names.
 */
const getOrderDetails = async (id) => {
  const orderRows = await query('SELECT * FROM orders WHERE id = ?', [id]);
  if (orderRows.length === 0) return null;

  const order = { ...orderRows[0], id: Number(orderRows[0].id) };

  const itemsSql = `
    SELECT oi.id, oi.product_id, p.name as product_name, oi.quantity, oi.unit_price, oi.line_total
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `;
  const rawItems = await query(itemsSql, [id]);
  const items = rawItems.map(item => ({
    ...item,
    id: Number(item.id)
  }));
  
  order.items = items;
  return order;
};

/**
 * Update the status of an order.
 */
const updateOrderStatus = async (id, status) => {
  const result = await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  if (Number(result.affectedRows) === 0) return null;
  
  // Return the updated basic order info
  const rows = await query('SELECT id, status FROM orders WHERE id = ?', [id]);
  return rows[0];
};

/**
 * Generate a WhatsApp-friendly text message for an order.
 */
const generateWhatsAppMessage = async (id) => {
  const order = await getOrderDetails(id);
  if (!order) return null;

  // Fetch shop settings to get the dynamic currency
  const shopSettingsRow = await query('SELECT currency FROM shop_settings LIMIT 1');
  const currency = shopSettingsRow.length > 0 ? shopSettingsRow[0].currency : 'LBP';

  let msg = `*Order #${order.order_number}*\n\n`;
  msg += `*Customer:* ${order.customer_name}\n`;
  msg += `*Phone:* ${order.customer_phone}\n`;
  msg += `*Type:* ${order.order_type === 'delivery' ? 'Delivery' : 'Pickup'}\n`;
  
  if (order.order_type === 'delivery' && order.delivery_address) {
    msg += `*Address:* ${order.delivery_address}\n`;
  }
  
  if (order.customer_notes) {
    msg += `*Notes:* ${order.customer_notes}\n`;
  }
  
  msg += `\n*Items:*\n`;
  for (const item of order.items) {
    // e.g., 2x Chocolate Crepe (15.00) = 30.00
    msg += `- ${item.quantity}x ${item.product_name || 'Unknown Product'} (${Number(item.unit_price).toFixed(2)} ${currency}) = ${Number(item.line_total).toFixed(2)} ${currency}\n`;
  }
  
  msg += `\n*Subtotal:* ${Number(order.subtotal).toFixed(2)} ${currency}\n`;
  
  if (order.order_type === 'delivery') {
    msg += `\n_(Delivery fee is not included in the subtotal and will be added.)_\n`;
  }

  return msg;
};

/**
 * Export all orders and their items.
 */
const exportAllOrders = async () => {
  const orders = await query('SELECT * FROM orders ORDER BY created_at DESC');
  const items = await query('SELECT * FROM order_items');
  
  // Group items by order
  const ordersWithItems = orders.map(order => ({
    ...order,
    id: Number(order.id),
    items: items.filter(item => Number(item.order_id) === Number(order.id)).map(item => ({
      ...item,
      id: Number(item.id),
      order_id: Number(item.order_id),
      product_id: Number(item.product_id)
    }))
  }));

  return ordersWithItems;
};

/**
 * Delete a single order and its items using a transaction.
 */
const deleteOneOrder = async (id) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    await conn.query('DELETE FROM order_items WHERE order_id = ?', [id]);
    const deleteOrderResult = await conn.query('DELETE FROM orders WHERE id = ?', [id]);
    
    if (Number(deleteOrderResult.affectedRows) === 0) {
      await conn.rollback();
      return false; // Order not found
    }

    await conn.commit();
    return true;
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

/**
 * Delete all orders and their items using a transaction.
 */
const deleteAllOrders = async () => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const deleteItemsResult = await conn.query('DELETE FROM order_items');
    const deleteOrdersResult = await conn.query('DELETE FROM orders');

    await conn.commit();
    return {
      deleted_orders: Number(deleteOrdersResult.affectedRows),
      deleted_order_items: Number(deleteItemsResult.affectedRows)
    };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err;
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  getOrders,
  getOrderDetails,
  updateOrderStatus,
  generateWhatsAppMessage,
  exportAllOrders,
  deleteOneOrder,
  deleteAllOrders,
};
