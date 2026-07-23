/**
 * Product validators.
 */
const validateId = (id) => {
  const parsed = Number(id);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return {
      valid: false,
      errors: [{ field: 'id', message: 'ID must be a positive integer' }],
    };
  }
  return { valid: true, value: parsed };
};

const validateProduct = (body, isUpdate = false) => {
  const errors = [];
  const data = {};

  // name
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    } else if (body.name.trim().length > 150) {
      errors.push({ field: 'name', message: 'Name cannot exceed 150 characters' });
    } else {
      data.name = body.name.trim();
    }
  } else if (!isUpdate) {
    errors.push({ field: 'name', message: 'Name is required' });
  }

  // category_id
  if (body.category_id !== undefined) {
    const cid = Number(body.category_id);
    if (!Number.isInteger(cid) || cid <= 0) {
      errors.push({ field: 'category_id', message: 'Valid Category ID is required' });
    } else {
      data.category_id = cid;
    }
  } else if (!isUpdate) {
    errors.push({ field: 'category_id', message: 'Category ID is required' });
  }

  // price
  if (body.price !== undefined) {
    const price = Number(body.price);
    if (isNaN(price) || price < 0) {
      errors.push({ field: 'price', message: 'Price must be a non-negative number' });
    } else {
      data.price = price;
    }
  } else if (!isUpdate) {
    errors.push({ field: 'price', message: 'Price is required' });
  }

  // description
  if (body.description !== undefined) {
    data.description = body.description ? body.description.trim() : null;
  }

  // is_available
  if (body.is_available !== undefined) {
    data.is_available = (body.is_available === 'true' || body.is_available === true || body.is_available === '1' || body.is_available === 1) ? 1 : 0;
  }

  // is_active
  if (body.is_active !== undefined) {
    data.is_active = (body.is_active === 'true' || body.is_active === true || body.is_active === '1' || body.is_active === 1) ? 1 : 0;
  }

  // display_order
  if (body.display_order !== undefined) {
    const order = Number(body.display_order);
    if (!Number.isInteger(order) || order < 0) {
      errors.push({ field: 'display_order', message: 'display_order must be a non-negative integer' });
    } else {
      data.display_order = order;
    }
  }

  if (isUpdate && Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'At least one field must be provided for update' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
};

module.exports = {
  validateId,
  validateProduct,
};
