/**
 * Category request validators.
 */

/**
 * Validate that a route :id param is a positive integer.
 * @param {string} id - raw param value
 * @returns {{ valid: boolean, errors?: Array }}
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

/**
 * Validate category body for create.
 * Required: name
 * Optional: is_active, display_order
 */
const validateCreate = (body) => {
  const errors = [];

  // name — required, trimmed, non-empty
  if (body.name === undefined || body.name === null) {
    errors.push({ field: 'name', message: 'Name is required' });
  } else if (typeof body.name !== 'string') {
    errors.push({ field: 'name', message: 'Name must be a string' });
  } else if (body.name.trim().length === 0) {
    errors.push({ field: 'name', message: 'Name cannot be empty' });
  } else if (body.name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
  }

  // is_active — optional, must be 0 or 1
  if (body.is_active !== undefined) {
    if (![0, 1, true, false].includes(body.is_active)) {
      errors.push({ field: 'is_active', message: 'is_active must be 0 or 1' });
    }
  }

  // display_order — optional, non-negative integer
  if (body.display_order !== undefined) {
    const order = Number(body.display_order);
    if (!Number.isInteger(order) || order < 0) {
      errors.push({ field: 'display_order', message: 'display_order must be a non-negative integer' });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  // Return sanitized data
  return {
    valid: true,
    data: {
      name: body.name.trim(),
      is_active: body.is_active !== undefined ? (body.is_active ? 1 : 0) : 1,
      display_order: body.display_order !== undefined ? Number(body.display_order) : 0,
    },
  };
};

/**
 * Validate category body for update.
 * All fields optional, but at least one must be provided.
 */
const validateUpdate = (body) => {
  const errors = [];
  const data = {};
  let hasField = false;

  // name — optional on update, but if provided must be valid
  if (body.name !== undefined) {
    hasField = true;
    if (typeof body.name !== 'string') {
      errors.push({ field: 'name', message: 'Name must be a string' });
    } else if (body.name.trim().length === 0) {
      errors.push({ field: 'name', message: 'Name cannot be empty' });
    } else if (body.name.trim().length > 100) {
      errors.push({ field: 'name', message: 'Name cannot exceed 100 characters' });
    } else {
      data.name = body.name.trim();
    }
  }

  // is_active
  if (body.is_active !== undefined) {
    hasField = true;
    if (![0, 1, true, false].includes(body.is_active)) {
      errors.push({ field: 'is_active', message: 'is_active must be 0 or 1' });
    } else {
      data.is_active = body.is_active ? 1 : 0;
    }
  }

  // display_order
  if (body.display_order !== undefined) {
    hasField = true;
    const order = Number(body.display_order);
    if (!Number.isInteger(order) || order < 0) {
      errors.push({ field: 'display_order', message: 'display_order must be a non-negative integer' });
    } else {
      data.display_order = order;
    }
  }

  if (!hasField) {
    errors.push({ field: 'body', message: 'At least one field must be provided for update' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
};

module.exports = { validateId, validateCreate, validateUpdate };
