/**
 * Emergency Password Reset Script
 * Usage: node scripts/reset-password.js <username>
 */
require('dotenv').config();
const readline = require('readline');
const bcrypt = require('bcrypt');
const { pool, query } = require('../src/database/pool');
const { validatePasswordChange } = require('../src/validators/auth.validator');

const username = process.argv[2];

if (!username) {
  console.error('\nError: Username is required.');
  console.error('Usage: node scripts/reset-password.js <username>\n');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper to prompt for password with masking
const promptPassword = (query) => {
  return new Promise((resolve) => {
    let password = '';
    process.stdout.write(query);

    const onData = (char) => {
      char = char.toString('utf8');
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.removeListener('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003': // Ctrl+C
          process.stdin.removeListener('data', onData);
          process.stdin.setRawMode(false);
          process.stdout.write('\n');
          process.exit(1);
          break;
        case '\b':
        case '\x7f':
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    };

    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', onData);
    } else {
      // Fallback if not TTY
      rl.question(query, (answer) => resolve(answer));
    }
  });
};

const run = async () => {
  try {
    const rows = await query('SELECT id, is_active FROM admins WHERE username = ?', [username]);
    if (rows.length === 0) {
      console.error(`\nError: Admin user '${username}' not found. Cannot reset password for a non-existent user.\n`);
      process.exit(1);
    }

    const admin = rows[0];

    const newPassword = await promptPassword('Enter new password: ');
    const confirmPassword = await promptPassword('Confirm new password: ');

    // Use the same validation rules
    const mockBody = {
      current_password: 'mock_current_password', // bypass current password check
      new_password: newPassword,
      confirm_password: confirmPassword
    };

    const validation = validatePasswordChange(mockBody);
    if (!validation.valid) {
      console.error('\nPassword validation failed:');
      validation.errors.forEach(err => {
        if (err.field !== 'current_password') {
          console.error(`- ${err.message}`);
        }
      });
      console.log('');
      process.exit(1);
    }

    const saltRounds = 10;
    const hash = await bcrypt.hash(newPassword, saltRounds);

    await query(
      'UPDATE admins SET password_hash = ?, token_version = token_version + 1, updated_at = NOW() WHERE id = ?',
      [hash, admin.id]
    );

    console.log(`\nSuccess: Password for admin '${username}' has been updated securely.\n`);
    process.exit(0);
  } catch (err) {
    console.error('\nAn error occurred:', err.message);
    process.exit(1);
  } finally {
    rl.close();
    try {
      await pool.end();
    } catch (e) {}
  }
};

run();
