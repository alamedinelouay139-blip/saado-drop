/**
 * Authentication Middleware.
 * Protects admin routes by verifying the provided JWT in the Authorization header.
 */
const { verifyToken } = require('../utils/jwt');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
    });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
  }

  // Check token_version against database to instantly invalidate tokens after password change
  const authService = require('../services/auth.service');
  authService.getAdminByIdForAuthentication(decoded.id).then(admin => {
    if (!admin || !admin.is_active || admin.token_version !== decoded.token_version) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
      });
    }

    // Attach decoded admin info to request object
    req.admin = decoded;
    next();
  }).catch(err => {
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  });
};

module.exports = authMiddleware;
