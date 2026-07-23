const fs = require('fs');
const path = require('path');
const { query } = require('../src/database/pool');

const checkDb = async () => {
  try {
    const allProducts = await query("SELECT * FROM products");
    const total = allProducts.length;
    
    let local = 0;
    let https = 0;
    let missingUrl = 0;
    let nonNullFileId = 0;
    
    const legacyProducts = [];

    for (const p of allProducts) {
      if (!p.image_url) {
        missingUrl++;
      } else if (p.image_url.startsWith('/uploads/')) {
        local++;
        legacyProducts.push(p);
      } else if (p.image_url.startsWith('http://') || p.image_url.startsWith('https://')) {
        https++;
      }
      
      if (p.image_file_id !== null) {
        nonNullFileId++;
      }
    }

    console.log(`Total Products: ${total}`);
    console.log(`Starts with /uploads/: ${local}`);
    console.log(`Starts with http/https: ${https}`);
    console.log(`Non-null image_file_id: ${nonNullFileId}`);
    console.log(`Missing image_url: ${missingUrl}`);
    console.log('\nLegacy products to migrate:');
    
    for (const p of legacyProducts) {
      const filePath = path.join(__dirname, '..', p.image_url);
      const exists = fs.existsSync(filePath);
      console.log(`- ID: ${p.id}, Name: "${p.name}", File: ${p.image_url}, Exists on disk: ${exists}`);
    }

    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
checkDb();
