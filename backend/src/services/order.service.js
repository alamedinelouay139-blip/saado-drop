/**
 * Order service with transaction support for customer orders.
 */
const { pool } = require('../database/pool');
const crypto = require('crypto');

const AppError = require('../utils/app-error');
const shopSettingsService = require('./shop-settings.service');

/**
 * Generate a unique order number.
 * e.g., ORD-1698234-A2B4
 */
const generateOrderNumber = () => {
  const timestamp = Date.now().toString().slice(-6);
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${randomHex}`;
};

/**
 * Create a new customer order.
 * Uses a MariaDB transaction to ensure all inserts succeed or rollback.
 */
const createCustomerOrder = async (orderData) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    // 1. Fetch real prices from database for the requested items
    const productIds = orderData.items.map(item => item.product_id);
    const placeholders = productIds.map(() => '?').join(',');
    
    // We only select active and available products
    const products = await conn.query(
      `SELECT id, name, price, is_available, is_active FROM products WHERE id IN (${placeholders})`, 
      productIds
    );

    const productMap = new Map();
    products.forEach(p => productMap.set(Number(p.id), p));

    let subtotalCents = 0;
    const finalItems = [];

    // 2. Validate products and calculate totals safely in cents
    for (const item of orderData.items) {
      const product = productMap.get(Number(item.product_id));
      
      if (!product) {
        throw new AppError(`Product ID ${item.product_id} does not exist`, 404);
      }
      if (!product.is_active || !product.is_available) {
        throw new AppError(`Product ID ${item.product_id} is currently unavailable`, 400);
      }

      const unitPriceCents = Math.round(Number(product.price) * 100);
      const lineTotalCents = unitPriceCents * item.quantity;
      subtotalCents += lineTotalCents;

      finalItems.push({
        product_id: item.product_id,
        name: product.name,
        quantity: item.quantity,
        unit_price: (unitPriceCents / 100).toFixed(2),
        line_total: (lineTotalCents / 100).toFixed(2)
      });
    }

    const subtotal = (subtotalCents / 100).toFixed(2);

    // 3. Insert into orders table
    const orderNumber = generateOrderNumber();
    
    const orderSql = `
      INSERT INTO orders 
      (order_number, customer_name, customer_phone, order_type, delivery_address, customer_notes, subtotal, status) 
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
    `;
    const orderParams = [
      orderNumber,
      orderData.customer_name,
      orderData.customer_phone,
      orderData.order_type,
      orderData.delivery_address,
      orderData.customer_notes,
      subtotal
    ];

    const orderResult = await conn.query(orderSql, orderParams);
    const orderId = Number(orderResult.insertId);

    // 4. Insert order items
    const itemsSql = `
      INSERT INTO order_items 
      (order_id, product_id, quantity, unit_price, line_total) 
      VALUES (?, ?, ?, ?, ?)
    `;
    
    for (const item of finalItems) {
      await conn.query(itemsSql, [
        orderId, 
        item.product_id, 
        item.quantity, 
        item.unit_price, 
        item.line_total
      ]);
    }

    // 5. Commit transaction
    await conn.commit();

    // 6. Build WhatsApp Message
    const settings = await shopSettingsService.getSettings();
    const currency = settings?.currency || 'LBP';
    const rawPhone = settings?.whatsapp_number || '';
    const phone = rawPhone.replace(/[^0-9]/g, '');

    const formatPrice = (price) => {
      return Number(price).toLocaleString('en-US');
    };

    let message = `Hello SAADO DROP 👋\n\nI would like to confirm my order.\n\n━━━━━━━━━━━━━━━━━━\n🧾 ORDER INVOICE\n━━━━━━━━━━━━━━━━━━\n\nOrder Number: #${orderNumber}\nCustomer Name: ${orderData.customer_name}\nPhone Number: ${orderData.customer_phone}\nOrder Type: ${orderData.order_type === 'delivery' ? 'Delivery' : 'Pickup'}\n`;
    
    if (orderData.order_type === 'delivery' && orderData.delivery_address) {
      message += `Address: ${orderData.delivery_address}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━\n🍫 ORDER ITEMS\n━━━━━━━━━━━━━━━━━━\n\n`;

    finalItems.forEach((item, index) => {
      message += `${index + 1}. ${item.name}\n   Quantity: ${item.quantity}\n   Unit Price: ${formatPrice(item.unit_price)} ${currency}\n   Total: ${formatPrice(item.line_total)} ${currency}\n\n`;
    });

    message += `━━━━━━━━━━━━━━━━━━\n💰 ORDER SUMMARY\n━━━━━━━━━━━━━━━━━━\n\nSubtotal: ${formatPrice(subtotal)} ${currency}\n`;

    if (orderData.order_type === 'delivery') {
      message += `Delivery Fee: Not included\nFinal Total: Delivery fee will be confirmed separately\n`;
    }

    if (orderData.customer_notes) {
      message += `\nSpecial Notes:\n${orderData.customer_notes}\n`;
    }

    message += `\n━━━━━━━━━━━━━━━━━━\n\nPlease confirm the order${orderData.order_type === 'delivery' ? ' and delivery fee' : ''}.\nThank you.`;

    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    return {
      order_id: orderId,
      order_number: orderNumber,
      subtotal: subtotal,
      status: 'pending',
      whatsapp_message: message,
      whatsapp_url: whatsappUrl
    };
  } catch (err) {
    if (conn) await conn.rollback();
    throw err; // Passed back to controller to handle
  } finally {
    if (conn) conn.release();
  }
};

module.exports = {
  createCustomerOrder,
};
