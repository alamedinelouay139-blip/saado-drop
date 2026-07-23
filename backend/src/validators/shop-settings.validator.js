/**
 * Shop Settings validator.
 */
const validateSettings = (body) => {
  const errors = [];
  const data = {};

  if (body.shop_name !== undefined) {
    if (typeof body.shop_name !== 'string' || body.shop_name.trim().length === 0) {
      errors.push({ field: 'shop_name', message: 'Shop name cannot be empty' });
    } else {
      data.shop_name = body.shop_name.trim();
    }
  }

  if (body.whatsapp_number !== undefined) {
    if (typeof body.whatsapp_number !== 'string' || body.whatsapp_number.trim().length === 0) {
      errors.push({ field: 'whatsapp_number', message: 'WhatsApp number cannot be empty' });
    } else {
      data.whatsapp_number = body.whatsapp_number.trim();
    }
  }

  if (body.currency !== undefined) {
    if (typeof body.currency !== 'string' || body.currency.trim().length === 0) {
      errors.push({ field: 'currency', message: 'Currency cannot be empty' });
    } else {
      data.currency = body.currency.trim();
    }
  }

  if (body.address !== undefined) {
    data.address = typeof body.address === 'string' ? body.address.trim() : null;
  }

  if (body.is_accepting_orders !== undefined) {
    data.is_accepting_orders = (body.is_accepting_orders === 'true' || body.is_accepting_orders === true || body.is_accepting_orders === '1' || body.is_accepting_orders === 1) ? 1 : 0;
  }

  if (Object.keys(data).length === 0) {
    errors.push({ field: 'body', message: 'At least one setting must be provided for update' });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data };
};

module.exports = {
  validateSettings,
};
