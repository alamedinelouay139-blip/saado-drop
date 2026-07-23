/**
 * Product service.
 */
const { query } = require('../database/pool');
const fs = require('fs');
const path = require('path');

/**
 * Get all active and available products, optionally filtered by category.
 */
const getPublicProducts = async (filters = {}) => {
  let sql = 'SELECT id, category_id, name, description, price, image_url, image_file_id, is_available, display_order FROM products WHERE is_active = 1 AND is_available = 1';
  const params = [];

  if (filters.category_id) {
    sql += ' AND category_id = ?';
    params.push(filters.category_id);
  }

  if (filters.search) {
    sql += ' AND LOWER(name) LIKE LOWER(?)';
    params.push(`%${filters.search}%`);
  }

  sql += ' ORDER BY display_order ASC, name ASC';
  return await query(sql, params);
};

/**
 * Get all products for admin, with optional status filter.
 * @param {string} filter - 'active', 'archived', or 'all'
 */
const getAdminProducts = async (filter = 'active') => {
  let sql = 'SELECT id, category_id, name, description, price, image_url, image_file_id, is_available, is_active, display_order FROM products';
  const params = [];

  if (filter === 'active') {
    sql += ' WHERE is_active = 1';
  } else if (filter === 'archived') {
    sql += ' WHERE is_active = 0';
  }

  sql += ' ORDER BY id DESC';
  return await query(sql, params);
};

/**
 * Get single product by ID (Public - must be active and available).
 */
const getPublicProductById = async (id) => {
  const rows = await query('SELECT id, category_id, name, description, price, image_url, image_file_id, is_available, display_order FROM products WHERE id = ? AND is_active = 1 AND is_available = 1', [id]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get single product by ID (Admin).
 */
const getProductById = async (id) => {
  const rows = await query('SELECT * FROM products WHERE id = ?', [id]);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Create a new product.
 */
const createProduct = async (data) => {
  const sql = `
    INSERT INTO products 
    (category_id, name, description, price, image_url, image_file_id, is_available, is_active, display_order) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    data.category_id,
    data.name,
    data.description || null,
    data.price,
    data.image_url,
    data.image_file_id || null,
    data.is_available !== undefined ? data.is_available : 1,
    data.is_active !== undefined ? data.is_active : 1,
    data.display_order || 0
  ];

  const result = await query(sql, params);
  return getProductById(Number(result.insertId));
};

/**
 * Update an existing product.
 * If a new image_url is provided, the controller handles deleting the old one safely.
 */
const updateProduct = async (id, data) => {
  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    params.push(value);
  }

  if (fields.length === 0) return null;

  params.push(id);
  
  const result = await query(
    `UPDATE products SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  if (Number(result.affectedRows) === 0) return null;

  return getProductById(id);
};

/**
 * Archive (soft-delete) a product.
 * We do not hard-delete to avoid breaking order_items relationships.
 */
const archiveProduct = async (id) => {
  const result = await query('UPDATE products SET is_active = 0 WHERE id = ?', [id]);
  return Number(result.affectedRows) > 0;
};

/**
 * Restore an archived product.
 */
const restoreProduct = async (id) => {
  const result = await query('UPDATE products SET is_active = 1 WHERE id = ?', [id]);
  return Number(result.affectedRows) > 0;
};

/**
 * Count how many order_items reference a specific product.
 */
const countProductOrderReferences = async (id) => {
  const rows = await query('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [id]);
  return Number(rows[0].count);
};

/**
 * Permanently delete a product (only safe if order references = 0).
 */
const permanentlyDeleteProduct = async (id) => {
  const result = await query('DELETE FROM products WHERE id = ?', [id]);
  return Number(result.affectedRows) > 0;
};

module.exports = {
  getPublicProducts,
  getAdminProducts,
  getProductById,
  getPublicProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  countProductOrderReferences,
  permanentlyDeleteProduct
};
