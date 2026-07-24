/**
 * Product routes.
 */
const express = require('express');
const productController = require('../controllers/product.controller');
const authMiddleware = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const asyncHandler = require('../utils/async-handler');

const router = express.Router();

// Protected admin routes (MUST be before /:id)
router.get('/admin/all', authMiddleware, asyncHandler(productController.getAdminProducts));
router.get('/admin/:id', authMiddleware, asyncHandler(productController.getAdminProductById));

// Public routes
router.get('/', asyncHandler(productController.getProducts));
router.get('/:id', asyncHandler(productController.getProductById));

const handleImageUpload = (req, res, next) => {
  // Prevent requests from hanging indefinitely due to Multer/Express stream issues
  let isDone = false;
  const timeoutId = setTimeout(() => {
    if (!isDone && !res.headersSent) {
      console.error('Multer upload timed out after 10s');
      res.status(408).json({ success: false, message: 'Request timeout during file upload' });
    }
  }, 10000);

  upload.single('image')(req, res, (err) => {
    isDone = true;
    clearTimeout(timeoutId);
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
    }
    next();
  });
};

// We use upload.single('image') for parsing multipart/form-data.
router.post('/', authMiddleware, handleImageUpload, asyncHandler(productController.createProduct));
router.patch('/:id', authMiddleware, handleImageUpload, asyncHandler(productController.updateProduct));
router.delete('/:id', authMiddleware, asyncHandler(productController.archiveProduct));
router.patch('/:id/restore', authMiddleware, asyncHandler(productController.restoreProduct));
router.delete('/:id/permanent', authMiddleware, asyncHandler(productController.permanentlyDeleteProduct));

module.exports = router;
