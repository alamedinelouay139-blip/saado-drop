/**
 * Category routes.
 *
 * GET    /api/categories      — list active categories (public)
 * GET    /api/categories/:id  — get single category
 * POST   /api/categories      — create category   (TODO: protect with auth)
 * PATCH  /api/categories/:id  — update category   (TODO: protect with auth)
 * DELETE /api/categories/:id  — deactivate category (TODO: protect with auth)
 */

const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middleware/auth.middleware');

const router = express.Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);
router.post('/', authMiddleware, categoryController.createCategory);
router.patch('/:id', authMiddleware, categoryController.updateCategory);
router.delete('/:id', authMiddleware, categoryController.deleteCategory);

module.exports = router;
