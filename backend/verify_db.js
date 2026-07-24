const mariadb = require('mariadb');

async function verifyDatabase() {
  let pool;
  try {
    pool = mariadb.createPool({
      host: 'sakura.proxy.rlwy.net',
      port: 40200,
      user: 'root',
      password: 'RIxhYWoeXRVPMFVchEukoQqkTyCTkOfR',
      database: 'railway',
      connectTimeout: 20000
    });

    const tables = await pool.query('SHOW TABLES');
    console.log(`Number of Tables: ${tables.length}`);
    
    if (tables.length > 0) {
      const products = await pool.query('SELECT COUNT(*) AS total FROM products');
      console.log(`Number of Products: ${products[0].total}`);
      
      const categories = await pool.query('SELECT COUNT(*) AS total FROM categories');
      console.log(`Number of Categories: ${categories[0].total}`);
      
      const admins = await pool.query('SELECT COUNT(*) AS total FROM admins');
      console.log(`Number of Admins: ${admins[0].total}`);
    }

  } catch (err) {
    console.error('Error verifying database:', err);
  } finally {
    if (pool) await pool.end();
  }
}

verifyDatabase();
