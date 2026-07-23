/**
 * Shop Settings service.
 */
const { query } = require('../database/pool');

/**
 * Get shop settings.
 */
const getSettings = async () => {
  const rows = await query('SELECT * FROM shop_settings LIMIT 1');
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Update shop settings.
 * Assumes a row exists (getSettings ensures this).
 */
const updateSettings = async (data) => {
  // We only ever update the first row
  const settings = await getSettings();
  const id = settings.id;

  const fields = [];
  const params = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    params.push(value);
  }

  if (fields.length === 0) return settings;

  params.push(id);
  
  await query(`UPDATE shop_settings SET ${fields.join(', ')} WHERE id = ?`, params);
  
  return await getSettings();
};

module.exports = {
  getSettings,
  updateSettings,
};
