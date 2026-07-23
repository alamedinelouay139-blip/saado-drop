/**
 * Category controller — thin layer between routes and service.
 */

const categoryService = require('../services/category.service');
const { validateId, validateCreate, validateUpdate } = require('../validators/category.validator');

/**
 * GET /api/categories
 * Public — returns only active categories.
 */
const getCategories = async (req, res) => {
  try {
    const categories = await categoryService.getActiveCategories();

    res.status(200).json({
      success: true,
      message: 'Categories retrieved successfully',
      data: categories,
    });
  } catch (error) {
    console.error('getCategories error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * GET /api/categories/:id
 * Returns a single category (active or inactive).
 */
const getCategoryById = async (req, res) => {
  try {
    const idResult = validateId(req.params.id);
    if (!idResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: idResult.errors,
      });
    }

    const category = await categoryService.getCategoryById(idResult.value);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category retrieved successfully',
      data: category,
    });
  } catch (error) {
    console.error('getCategoryById error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * POST /api/categories
 * Creates a new category.
 * NOTE: Temporarily unprotected — auth middleware will be added in the Authentication phase.
 */
const createCategory = async (req, res) => {
  try {
    const validation = validateCreate(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // Check for duplicate name
    const duplicate = await categoryService.nameExists(validation.data.name);
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'name', message: 'A category with this name already exists' }],
      });
    }

    const category = await categoryService.createCategory(validation.data);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('createCategory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * PATCH /api/categories/:id
 * Updates an existing category.
 * NOTE: Temporarily unprotected — auth middleware will be added in the Authentication phase.
 */
const updateCategory = async (req, res) => {
  try {
    const idResult = validateId(req.params.id);
    if (!idResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: idResult.errors,
      });
    }

    const validation = validateUpdate(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validation.errors,
      });
    }

    // If name is being updated, check for duplicates (excluding current category)
    if (validation.data.name) {
      const duplicate = await categoryService.nameExists(validation.data.name, idResult.value);
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: 'Validation failed',
          errors: [{ field: 'name', message: 'A category with this name already exists' }],
        });
      }
    }

    const category = await categoryService.updateCategory(idResult.value, validation.data);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('updateCategory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * DELETE /api/categories/:id
 * Hard deletes a category, but only if it contains no products.
 */
const deleteCategory = async (req, res) => {
  try {
    const idResult = validateId(req.params.id);
    if (!idResult.valid) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: idResult.errors,
      });
    }

    const categoryId = idResult.value;

    // Check if any products exist in this category
    const productCount = await categoryService.countProductsInCategory(categoryId);
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'This category cannot be deleted because it still contains active or archived products. Permanently delete unused products or move them to another category first.',
      });
    }

    const deleted = await categoryService.deleteCategory(categoryId);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('deleteCategory error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
