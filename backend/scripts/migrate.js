/**
 * Database Migration: Add token_version to admins
 */
const { pool, query } = require('../src/database/pool');

const migrate = async () => {
  try {
    console.log('Running database migration...');

    // Check if column exists
    const checkSql = `
      SELECT count(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'admins' 
        AND COLUMN_NAME = 'token_version'
    `;
    const checkResult = await query(checkSql);
    const exists = checkResult[0].count > 0;

    if (exists) {
      console.log('Migration skipped: token_version column already exists in admins table.');
    } else {
      console.log('Adding token_version column to admins table...');
      await query('ALTER TABLE admins ADD COLUMN token_version INT NOT NULL DEFAULT 0');
      console.log('Admin migration completed successfully.');
    }

    // Check if image_file_id column exists
    const checkProductSql = `
      SELECT count(*) as count 
      FROM information_schema.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'products' 
        AND COLUMN_NAME = 'image_file_id'
    `;
    const checkProductResult = await query(checkProductSql);
    const productColExists = checkProductResult[0].count > 0;

    if (productColExists) {
      console.log('Migration skipped: image_file_id column already exists in products table.');
    } else {
      console.log('Adding image_file_id column to products table...');
      await query('ALTER TABLE products ADD COLUMN image_file_id VARCHAR(255) NULL');
      console.log('Product migration completed successfully.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {}
  }
};

migrate();
