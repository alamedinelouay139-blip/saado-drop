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
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer upload error:', err);
      return res.status(400).json({ success: false, message: 'File upload error', error: err.message });
    }
    
    if (req.file) {
      const buf = req.file.buffer;
      if (!buf || buf.length < 12) {
        return res.status(400).json({ success: false, message: 'Invalid image file content' });
      }
      const hex = buf.toString('hex', 0, 12);
      let isValidSignature = false;
      
      // PNG: 89504e470d0a1a0a
      if (req.file.mimetype === 'image/png' && hex.startsWith('89504e470d0a1a0a')) {
        isValidSignature = true;
      }
      // JPEG: ffd8ff
      else if (req.file.mimetype === 'image/jpeg' && hex.startsWith('ffd8ff')) {
        isValidSignature = true;
      }
      // WEBP: starts with 52494646 (RIFF), chars 8-11 are 57454250 (WEBP)
      else if (req.file.mimetype === 'image/webp' && hex.startsWith('52494646') && hex.substring(16, 24) === '57454250') {
        isValidSignature = true;
      }
      
      if (!isValidSignature) {
        return res.status(400).json({ success: false, message: 'File signature does not match expected image type' });
      }
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
