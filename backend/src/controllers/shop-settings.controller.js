/**
 * Shop Settings controller.
 */
const shopSettingsService = require('../services/shop-settings.service');
const { validateSettings } = require('../validators/shop-settings.validator');

/**
 * GET /api/shop-settings
 * Public - get shop settings.
 */
const getSettings = async (req, res) => {
  const settings = await shopSettingsService.getSettings();

  res.status(200).json({
    success: true,
    message: 'Shop settings retrieved successfully',
    data: settings || {},
  });
};

/**
 * PATCH /api/shop-settings
 * Protected - update shop settings.
 */
const updateSettings = async (req, res) => {
  const validation = validateSettings(req.body);
  
  if (!validation.valid) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: validation.errors,
    });
  }

  const updatedSettings = await shopSettingsService.updateSettings(validation.data);

  res.status(200).json({
    success: true,
    message: 'Shop settings updated successfully',
    data: updatedSettings,
  });
};

module.exports = {
  getSettings,
  updateSettings,
};
