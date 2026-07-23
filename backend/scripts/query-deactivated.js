require('dotenv').config();
const { query, pool } = require('../src/database/pool');

(async () => {
  try {
    const prods = await query('SELECT id, name, category_id, is_active FROM products WHERE is_active = 0');
    console.log('\\n--- DEACTIVATED PRODUCTS ---');
    console.table(prods);
  } catch(err) {
    console.error(err);
  } finally {
    pool.end();
  }
})();
