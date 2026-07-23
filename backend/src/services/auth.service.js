/**
 * Auth service for admin login.
 */
const { query } = require('../database/pool');

/**
 * Get an admin by their username.
 * @param {string} username
 * @returns {object|null} Admin record or null
 */
const getAdminByUsername = async (username) => {
  const rows = await query(
    'SELECT id, full_name, username, password_hash, is_active, token_version FROM admins WHERE username = ?',
    [username]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Update the last login time for an admin.
 * @param {number} adminId
 */
const updateLastLogin = async (adminId) => {
  await query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [adminId]);
};

/**
 * Get public profile of an admin by ID (excludes password).
 * @param {number} adminId
 * @returns {object|null}
 */
const getAdminProfile = async (adminId) => {
  const rows = await query(
    'SELECT id, full_name, username, is_active, last_login_at, created_at, updated_at FROM admins WHERE id = ?',
    [adminId]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get an admin by ID for authentication purposes (includes password and token_version).
 * @param {number} adminId
 * @returns {object|null} Admin record or null
 */
const getAdminByIdForAuthentication = async (adminId) => {
  const rows = await query(
    'SELECT id, password_hash, token_version, is_active FROM admins WHERE id = ?',
    [adminId]
  );
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Update the admin password and increment token_version.
 * @param {number} adminId
 * @param {string} passwordHash
 */
const updateAdminPassword = async (adminId, passwordHash) => {
  const result = await query(
    'UPDATE admins SET password_hash = ?, token_version = token_version + 1, updated_at = NOW() WHERE id = ?',
    [passwordHash, adminId]
  );
  if (result.affectedRows === 0) {
    throw new Error('Admin not found or password could not be updated.');
  }
};

module.exports = {
  getAdminByUsername,
  updateLastLogin,
  getAdminProfile,
  getAdminByIdForAuthentication,
  updateAdminPassword,
};
