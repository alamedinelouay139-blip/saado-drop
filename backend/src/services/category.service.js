/**
 * Category service — business logic and database queries.
 */

const { query } = require('../database/pool');

/**
 * Get all active categories (public).
 * Ordered by display_order ascending, then name.
 */
const getActiveCategories = async () => {
  const rows = await query(
    'SELECT id, name, display_order, created_at, updated_at FROM categories WHERE is_active = 1 ORDER BY display_order ASC, name ASC'
  );
  return rows;
};

/**
 * Get a single category by ID (returns all fields).
 * @param {number} id
 * @returns {object|null}
 */
const getCategoryById = async (id) => {
  const rows = await query(
    'SELECT id, name, is_active, display_order, created_at, updated_at FROM categories WHERE id = ?',
    [id]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Check if a category name already exists (case-insensitive).
 * Optionally exclude a specific ID (for updates).
 * @param {string} name
 * @param {number|null} excludeId
 * @returns {boolean}
 */
const nameExists = async (name, excludeId = null) => {
  let sql = 'SELECT id FROM categories WHERE LOWER(name) = LOWER(?)';
  const params = [name];

  if (excludeId) {
    sql += ' AND id != ?';
    params.push(excludeId);
  }

  const rows = await query(sql, params);
  return rows.length > 0;
};

/**
 * Create a new category.
 * @param {{ name: string, is_active: number, display_order: number }} data
 * @returns {object} the created category
 */
const createCategory = async (data) => {
  const result = await query(
    'INSERT INTO categories (name, is_active, display_order) VALUES (?, ?, ?)',
    [data.name, data.is_active, data.display_order]
  );

  // MariaDB returns insertId as BigInt, convert to Number
  const id = Number(result.insertId);
  return getCategoryById(id);
};

/**
 * Update a category by ID.
 * @param {number} id
 * @param {object} data — fields to update
 * @returns {object|null} updated category or null if not found
 */
const updateCategory = async (id, data) => {
  // Build SET clause dynamically from provided fields
  const fields = [];
  const params = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    params.push(data.name);
  }
  if (data.is_active !== undefined) {
    fields.push('is_active = ?');
    params.push(data.is_active);
  }
  if (data.display_order !== undefined) {
    fields.push('display_order = ?');
    params.push(data.display_order);
  }

  if (fields.length === 0) return null;

  params.push(id);
  const result = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = ?`,
    params
  );

  if (Number(result.affectedRows) === 0) return null;

  return getCategoryById(id);
};

/**
 * Count the number of products that belong to a category.
 * @param {number} categoryId
 * @returns {number}
 */
const countProductsInCategory = async (categoryId) => {
  const rows = await query(
    'SELECT COUNT(*) as count FROM products WHERE category_id = ?',
    [categoryId]
  );
  return Number(rows[0].count);
};

/**
 * Hard delete a category.
 * @param {number} id
 * @returns {boolean} true if deleted, false if not found
 */
const deleteCategory = async (id) => {
  const result = await query(
    'DELETE FROM categories WHERE id = ?',
    [id]
  );
  return Number(result.affectedRows) > 0;
};

module.exports = {
  getActiveCategories,
  getCategoryById,
  nameExists,
  createCategory,
  updateCategory,
  deleteCategory,
  countProductsInCategory,
};
