const fs = require('fs');
const mariadb = require('mariadb');

async function importDatabase() {
  let pool;
  try {
    console.log('Connecting to Railway Database...');
    pool = mariadb.createPool({
      host: 'sakura.proxy.rlwy.net',
      port: 40200,
      user: 'root',
      password: 'RIxhYWoeXRVPMFVchEukoQqkTyCTkOfR',
      database: 'railway',
      multipleStatements: true,
      connectTimeout: 20000
    });

    console.log('Reading SQL file...');
    let sql = fs.readFileSync('../crepe_shop_db_backup_utf8.sql', 'utf8');
    if (sql.charCodeAt(0) === 0xFEFF) {
      sql = sql.slice(1);
    }

    console.log('Executing SQL import...');
    await pool.query(sql);

    console.log('Database import completed successfully!');
  } catch (err) {
    console.error('Error importing database:', err);
  } finally {
    if (pool) await pool.end();
  }
}

importDatabase();
