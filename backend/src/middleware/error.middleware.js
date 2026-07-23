const AppError = require('../utils/app-error');

const errorMiddleware = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err.message);
  }
  
  // Handle AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.errors && err.errors.length > 0 && { errors: err.errors })
    });
  }

  // Handle Multer file size / type errors
  if (err.name === 'MulterError' && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errors: [{ field: 'image', message: 'File is too large.' }]
    });
  }
  if (err.message && err.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errors: [{ field: 'image', message: err.message }]
    });
  }
  if (err.message && err.message.includes('File extension does not match')) {
    return res.status(400).json({
      success: false,
      message: 'File upload error',
      errors: [{ field: 'image', message: err.message }]
    });
  }

  // Handle SyntaxError (Malformed JSON)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Malformed JSON payload',
    });
  }

  // Database Duplicate Entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      success: false,
      message: 'Resource already exists',
    });
  }

  // Fallback 500
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(err.errors && { errors: err.errors })
  });
};

module.exports = errorMiddleware;
