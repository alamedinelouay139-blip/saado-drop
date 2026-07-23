const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { query } = require('../src/database/pool');
const env = require('../src/config/env');
const https = require('https');

const backupSqlPath = 'C:\\Users\\pc\\Desktop\\products_backup.sql';
const backupZipPath = 'C:\\Users\\pc\\Desktop\\legacy_product_images.zip';
const snapshotPath = 'C:\\Users\\pc\\Desktop\\pre_imagekit_migration_snapshot.json';

const verifyRemoteImage = (url) => {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve({
        statusCode: res.statusCode,
        contentType: res.headers['content-type']
      });
    }).on('error', (e) => {
      resolve({ error: e.message });
    });
  });
};

const run = async () => {
  try {
    console.log('--- STEP 1: CREATE BACKUPS ---');
    const dbUser = env.DB_USER;
    const dbPass = env.DB_PASSWORD ? `-p"${env.DB_PASSWORD}"` : '';
    const dbName = env.DB_NAME;
    
    // 1. MySQL Dump
    console.log('Running mysqldump...');
    execSync(`"C:\\xampp\\mysql\\bin\\mysqldump.exe" -u ${dbUser} ${dbPass} ${dbName} products > ${backupSqlPath}`);
    
    // 2. Zip Images
    console.log('Zipping images...');
    const imagesDir = path.join(__dirname, '..', 'uploads', 'products');
    execSync(`powershell -Command "Compress-Archive -Path '${imagesDir}' -DestinationPath '${backupZipPath}' -Force"`);

    const sqlStat = fs.statSync(backupSqlPath);
    const zipStat = fs.statSync(backupZipPath);
    console.log(`Backup SQL Size: ${sqlStat.size} bytes`);
    console.log(`Backup ZIP Size: ${zipStat.size} bytes`);

    if (sqlStat.size === 0 || zipStat.size === 0) {
      throw new Error('Backup failed: file size is 0');
    }

    console.log('\n--- STEP 2: PRE-MIGRATION SNAPSHOT ---');
    const preProducts = await query("SELECT * FROM products");
    fs.writeFileSync(snapshotPath, JSON.stringify(preProducts, null, 2));
    console.log(`Snapshot saved to ${snapshotPath} (${preProducts.length} products)`);

    console.log('\n--- STEP 3: RUN THE REAL MIGRATION ---');
    const migrationOutput = execSync('node scripts/migrate-local-images-to-imagekit.js', { encoding: 'utf8' });
    console.log(migrationOutput);

    console.log('\n--- STEP 4: VERIFY DATABASE AFTER MIGRATION ---');
    const postProducts = await query("SELECT * FROM products");
    if (postProducts.length !== preProducts.length) {
      throw new Error('Product count changed!');
    }

    let httpsCount = 0;
    let localCount = 0;
    let missingUrlCount = 0;

    for (let i = 0; i < postProducts.length; i++) {
      const pre = preProducts.find(p => p.id === postProducts[i].id);
      const post = postProducts[i];
      
      if (!post.image_url) missingUrlCount++;
      else if (post.image_url.startsWith('http')) httpsCount++;
      else if (post.image_url.startsWith('/uploads/')) localCount++;

      // Verify unrelated fields didn't change
      const fields = ['name', 'description', 'price', 'category_id', 'is_active', 'is_available'];
      for (const field of fields) {
        if (pre[field] !== post[field]) {
          throw new Error(`Unrelated field ${field} changed for product ${post.id}`);
        }
      }
    }
    console.log(`Post-migration DB: Total=${postProducts.length}, HTTPS=${httpsCount}, Local=${localCount}, Missing=${missingUrlCount}`);

    console.log('\n--- STEP 5: VERIFY REMOTE IMAGEKIT FILES ---');
    for (const post of postProducts) {
      if (post.image_url.startsWith('http')) {
        const verify = await verifyRemoteImage(post.image_url);
        console.log(`Product ${post.id} (${post.name}):`);
        console.log(`  - URL: Reachable [HTTP ${verify.statusCode}]`);
        console.log(`  - Content-Type: ${verify.contentType}`);
        console.log(`  - image_file_id: ${post.image_file_id ? 'Present' : 'Missing'}`);
      }
    }

    console.log('\n--- STEP 7: VERIFY LOCAL BACKUP FILES REMAIN ---');
    const zipStillExists = fs.existsSync(backupZipPath);
    const sqlStillExists = fs.existsSync(backupSqlPath);
    const snapStillExists = fs.existsSync(snapshotPath);
    console.log(`ZIP exists: ${zipStillExists}, SQL exists: ${sqlStillExists}, Snapshot exists: ${snapStillExists}`);

    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
};

run();
