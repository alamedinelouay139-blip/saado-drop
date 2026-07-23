/**
 * 404 Not Found middleware.
 * Catch-all for routes that do not exist.
 */
const notFoundMiddleware = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Resource not found',
  });
};

module.exports = notFoundMiddleware;
