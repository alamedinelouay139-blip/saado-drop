/**
 * JWT Utility for signing and verifying tokens.
 */
const jwt = require('jsonwebtoken');

// Config handles missing secrets and kills the server
const config = require('../config/env');
const getSecret = () => config.JWT_SECRET;
const getExpiresIn = () => config.JWT_EXPIRES_IN;

/**
 * Generate a JWT token for an admin.
 * @param {object} payload - Admin info (e.g., { id: 1, username: 'admin' })
 * @returns {string} Signed token
 */
const signToken = (payload) => {
  return jwt.sign(payload, getSecret(), { expiresIn: getExpiresIn() });
};

/**
 * Verify a JWT token.
 * @param {string} token
 * @returns {object|null} Decoded payload if valid, null otherwise
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, getSecret());
  } catch (err) {
    return null;
  }
};

module.exports = {
  signToken,
  verifyToken,
};
