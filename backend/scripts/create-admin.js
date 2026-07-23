/**
 * Utility script to create a secure admin user in the database.
 * Run this directly: node scripts/create-admin.js <username> <password> <full_name>
 */
const bcrypt = require('bcrypt');
const { pool, query } = require('../src/database/pool');

const createAdmin = async () => {
  const [,, username, password, fullName] = process.argv;

  if (!username || !password || !fullName) {
    console.error('Usage: node scripts/create-admin.js <username> <password> "<Full Name>"');
    process.exit(1);
  }

  if (username.trim().length < 3) {
    console.error('Error: Username must be at least 3 characters long.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    await query(
      'INSERT INTO admins (full_name, username, password_hash) VALUES (?, ?, ?)',
      [fullName.trim(), username.trim(), hash]
    );

    console.log(`Admin user '${username}' created successfully.`);
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      console.error(`Error: Admin username '${username}' already exists.`);
    } else {
      console.error('Error creating admin:', error.message);
    }
    process.exit(1);
  } finally {
    try {
      await pool.end();
    } catch (e) {}
  }
};

createAdmin();
