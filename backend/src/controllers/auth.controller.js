/**
 * Auth controller.
 */
const bcrypt = require('bcrypt');
const authService = require('../services/auth.service');
const { validateLogin, validatePasswordChange } = require('../validators/auth.validator');
const { signToken } = require('../utils/jwt');

/**
 * POST /api/auth/login
 * Admin login endpoint.
 */
const login = async (req, res) => {
  const validation = validateLogin(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  const { username, password } = validation.data;

  // Retrieve admin
  const admin = await authService.getAdminByUsername(username);

  // Generic generic error for invalid username or password, or if account is disabled
  if (!admin || !admin.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Compare passwords safely using bcrypt
  const isMatch = await bcrypt.compare(password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials',
    });
  }

  // Generate JWT
  const token = signToken({
    id: admin.id,
    username: admin.username,
    token_version: admin.token_version,
  });

  // Update last login (fire and forget, don't await)
  authService.updateLastLogin(admin.id).catch((err) => {
    console.error('Failed to update last login:', err.message);
  });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      admin: {
        id: admin.id,
        full_name: admin.full_name,
        username: admin.username,
      },
    },
  });
};

/**
 * GET /api/auth/profile
 * Returns the currently authenticated admin's profile.
 */
const getProfile = async (req, res) => {
  const adminId = req.admin.id;
  const profile = await authService.getAdminProfile(adminId);

  if (!profile) {
    return res.status(404).json({
      success: false,
      message: 'Admin profile not found',
    });
  }

  res.status(200).json({
    success: true,
    message: 'Profile retrieved successfully',
    data: profile,
  });
};

/**
 * PATCH /api/auth/password
 * Change the authenticated admin's password.
 */
const changePassword = async (req, res) => {
  const adminId = req.admin.id;

  const validation = validatePasswordChange(req.body);
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  const { current_password, new_password } = validation.data;

  // Retrieve admin for authentication (including password_hash)
  const admin = await authService.getAdminByIdForAuthentication(adminId);

  if (!admin || !admin.is_active) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  // Verify current password
  const isMatch = await bcrypt.compare(current_password, admin.password_hash);
  if (!isMatch) {
    return res.status(401).json({
      success: false,
      message: 'Current password is incorrect.',
    });
  }

  // Hash new password
  const saltRounds = 10;
  const newPasswordHash = await bcrypt.hash(new_password, saltRounds);

  // Update password in DB
  await authService.updateAdminPassword(adminId, newPasswordHash);

  res.status(200).json({
    success: true,
    message: 'Password changed successfully. Please sign in again.',
    data: {
      requires_reauthentication: true,
    },
  });
};

module.exports = {
  login,
  getProfile,
  changePassword,
};
