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

// We use upload.single('image') for parsing multipart/form-data.
router.post('/', authMiddleware, upload.single('image'), asyncHandler(productController.createProduct));
router.patch('/:id', authMiddleware, upload.single('image'), asyncHandler(productController.updateProduct));
router.delete('/:id', authMiddleware, asyncHandler(productController.archiveProduct));
router.patch('/:id/restore', authMiddleware, asyncHandler(productController.restoreProduct));
router.delete('/:id/permanent', authMiddleware, asyncHandler(productController.permanentlyDeleteProduct));

module.exports = router;
