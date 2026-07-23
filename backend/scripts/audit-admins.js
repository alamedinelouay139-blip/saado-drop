const { query } = require('../src/database/pool');
const bcrypt = require('bcrypt');

const audit = async () => {
  try {
    const admins = await query('SELECT id, username, password_hash, is_active FROM admins');
    console.log(`Total admins: ${admins.length}`);
    
    let testadminExists = false;
    let hashExists = false;
    let isBcrypt = false;
    let passwordMatch = false;

    for (const admin of admins) {
      console.log(`- Username: ${admin.username}, is_active: ${admin.is_active}`);
      if (admin.username === 'testadmin') {
        testadminExists = true;
        if (admin.password_hash) {
          hashExists = true;
          isBcrypt = admin.password_hash.startsWith('$2');
          // Try to compare against 'secret123' (the expected password)
          passwordMatch = await bcrypt.compare('secret123', admin.password_hash);
        }
      }
    }

    console.log(`\nTestadmin exists: ${testadminExists}`);
    console.log(`Hash exists: ${hashExists}`);
    console.log(`Is bcrypt: ${isBcrypt}`);
    console.log(`Matches 'secret123': ${passwordMatch}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

audit();
