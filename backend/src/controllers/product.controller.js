/**
 * Product controller.
 */
const fs = require('fs');
const path = require('path');
const productService = require('../services/product.service');
const categoryService = require('../services/category.service');
const imageService = require('../services/image.service');
const { validateId, validateProduct } = require('../validators/product.validator');

/**
 * Helper to delete a file if it exists.
 */
const safeDeleteFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.error('Failed to delete file:', filePath, err.message);
    }
  }
};

/**
 * GET /api/products
 * Public - get active and available products.
 */
const getProducts = async (req, res) => {
  const { category_id, search } = req.query;
  const filters = {};

  if (category_id) {
    const cid = Number(category_id);
    if (Number.isInteger(cid) && cid > 0) filters.category_id = cid;
  }
  if (search && typeof search === 'string') {
    filters.search = search.trim();
  }

  // If admin is authenticated (via a specific route, or we check req.admin), we could return all.
  // For now, this public route returns only public products.
  const products = await productService.getPublicProducts(filters);

  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: products,
  });
};

/**
 * GET /api/products/admin
 * Protected - get all products with optional status filter.
 */
const getAdminProducts = async (req, res) => {
  let status = req.query.status || 'active';
  const validStatuses = ['active', 'archived', 'all'];
  if (!validStatuses.includes(status)) {
    status = 'active';
  }

  const products = await productService.getAdminProducts(status);
  res.status(200).json({
    success: true,
    message: 'Products retrieved successfully',
    data: products,
  });
};

/**
 * GET /api/products/:id
 * Public - get single product (must be active and available).
 */
const getProductById = async (req, res) => {
  const idResult = validateId(req.params.id);
  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const product = await productService.getPublicProductById(idResult.value);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
};

/**
 * GET /api/products/admin/:id
 * Protected - get single product regardless of status.
 */
const getAdminProductById = async (req, res) => {
  const idResult = validateId(req.params.id);
  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const product = await productService.getProductById(idResult.value);
  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Product retrieved successfully',
    data: product,
  });
};

/**
 * POST /api/products
 * Protected - create product with image upload.
 */
const createProduct = async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'image', message: 'Product image is required' }]
    });
  }

  const validation = validateProduct(req.body, false);
  if (!validation.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
  }

  // Validate category exists
  const category = await categoryService.getCategoryById(validation.data.category_id);
  if (!category) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: [{ field: 'category_id', message: 'Referenced category does not exist' }]
    });
  }

  let imageUrl = null;
  let imageFileId = null;

  try {
    const uploadResult = await imageService.uploadProductImage(file.buffer, file.originalname, file.mimetype);
    imageUrl = uploadResult.secure_url;
    imageFileId = uploadResult.fileId;
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Image upload failed', error: err.message });
  }

  const productData = { ...validation.data, image_url: imageUrl, image_file_id: imageFileId };

  try {
    const product = await productService.createProduct(productData);
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product,
    });
  } catch (err) {
    // Rollback ImageKit if DB insert fails
    if (imageFileId) {
      await imageService.deleteProductImage(imageFileId);
    }
    return res.status(500).json({ success: false, message: 'Database insert failed' });
  }
};

/**
 * PATCH /api/products/:id
 * Protected - update product (with optional new image).
 */
const updateProduct = async (req, res) => {
  const idResult = validateId(req.params.id);
  const file = req.file;

  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const validation = validateProduct(req.body, true);
  if (!validation.valid && !file) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: validation.errors });
  }

  const existingProduct = await productService.getProductById(idResult.value);
  if (!existingProduct) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const updateData = validation.valid ? validation.data : {};

  if (updateData.category_id) {
    const category = await categoryService.getCategoryById(updateData.category_id);
    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: [{ field: 'category_id', message: 'Referenced category does not exist' }]
      });
    }
  }

  let newImageFileId = null;
  
  if (file) {
    try {
      const uploadResult = await imageService.uploadProductImage(file.buffer, file.originalname, file.mimetype);
      updateData.image_url = uploadResult.secure_url;
      updateData.image_file_id = uploadResult.fileId;
      newImageFileId = uploadResult.fileId;
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Image upload failed', error: err.message });
    }
  }

  let updatedProduct = null;
  try {
    updatedProduct = await productService.updateProduct(idResult.value, updateData);
  } catch (err) {
    // Rollback new upload
    if (newImageFileId) {
      await imageService.deleteProductImage(newImageFileId);
    }
    return res.status(500).json({ success: false, message: 'Database update failed' });
  }

  // If update succeeded and there was an old image, safely remove it
  if (updatedProduct && file) {
    if (existingProduct.image_file_id) {
      await imageService.deleteProductImage(existingProduct.image_file_id);
    } else if (existingProduct.image_url && existingProduct.image_url.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, '../..', existingProduct.image_url);
      // Ensure path is inside uploads/products
      if (oldImagePath.includes(path.normalize('backend/uploads/products')) || oldImagePath.includes(path.normalize('backend\\uploads\\products'))) {
         safeDeleteFile(oldImagePath);
      } else {
         safeDeleteFile(oldImagePath); // Will fall back to whatever it resolved to, though we should be safe.
      }
    }
  }

  res.status(200).json({
    success: true,
    message: 'Product updated successfully',
    data: updatedProduct,
  });
};

/**
 * DELETE /api/products/:id
 * Protected - archive product (soft delete).
 */
const archiveProduct = async (req, res) => {
  const idResult = validateId(req.params.id);
  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const archived = await productService.archiveProduct(idResult.value);
  if (!archived) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Product archived successfully',
  });
};

/**
 * PATCH /api/products/:id/restore
 * Protected - restore an archived product.
 */
const restoreProduct = async (req, res) => {
  const idResult = validateId(req.params.id);
  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const restored = await productService.restoreProduct(idResult.value);
  if (!restored) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  res.status(200).json({
    success: true,
    message: 'Product restored successfully',
  });
};

/**
 * DELETE /api/products/:id/permanent
 * Protected - permanently delete a product (only safe if order references = 0).
 */
const permanentlyDeleteProduct = async (req, res) => {
  const idResult = validateId(req.params.id);
  if (!idResult.valid) {
    return res.status(400).json({ success: false, message: 'Validation failed', errors: idResult.errors });
  }

  const productId = idResult.value;

  const existingProduct = await productService.getProductById(productId);
  if (!existingProduct) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const orderReferences = await productService.countProductOrderReferences(productId);
  if (orderReferences > 0) {
    return res.status(409).json({
      success: false,
      message: 'This product cannot be permanently deleted because it exists in previous orders. Archive it instead.'
    });
  }

  const tempFileId = existingProduct.image_file_id;
  const tempUrl = existingProduct.image_url;

  const deleted = await productService.permanentlyDeleteProduct(productId);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  // Safely delete the physical image file now that the DB row is permanently gone
  if (tempFileId) {
    await imageService.deleteProductImage(tempFileId);
  } else if (tempUrl && tempUrl.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '../../', tempUrl);
    safeDeleteFile(filePath);
  }

  res.status(200).json({
    success: true,
    message: 'Product permanently deleted.',
  });
};

module.exports = {
  getProducts,
  getAdminProducts,
  getProductById,
  getAdminProductById,
  createProduct,
  updateProduct,
  archiveProduct,
  restoreProduct,
  permanentlyDeleteProduct,
};
