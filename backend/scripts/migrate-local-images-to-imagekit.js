/**
 * Legacy Image Migration to ImageKit
 * Usage:
 *   Dry Run: node scripts/migrate-local-images-to-imagekit.js --dry-run
 *   Real Run: node scripts/migrate-local-images-to-imagekit.js
 */
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/database/pool');
const imageService = require('../src/services/image.service');
const env = require('../src/config/env');

const isDryRun = process.argv.includes('--dry-run');

const migrate = async () => {
  console.log('==================================================');
  console.log(`Starting Legacy Image Migration to ImageKit ${isDryRun ? '(DRY RUN)' : '(REAL RUN)'}`);
  console.log(`Database Host: ${env.DB_HOST}`);
  console.log(`Database Name: ${env.DB_NAME}`);
  console.log('==================================================');

  if (!env.IMAGEKIT_PUBLIC_KEY || !env.IMAGEKIT_PRIVATE_KEY) {
    console.error('ERROR: ImageKit credentials are not configured in .env');
    process.exit(1);
  }

  try {
    const products = await query("SELECT id, name, image_url, image_file_id FROM products WHERE image_url LIKE '/uploads/%'");
    
    console.log(`Discovered ${products.length} legacy products needing migration.\n`);

    let migrated = 0;
    let skipped = 0;
    let missingFiles = 0;
    let failedUploads = 0;
    let failedDbUpdates = 0;

    for (const product of products) {
      console.log(`[Product ${product.id}] ${product.name}`);
      
      if (product.image_file_id) {
        console.log(` -> SKIP: Already has an image_file_id.`);
        skipped++;
        continue;
      }

      const filePath = path.join(__dirname, '..', product.image_url);
      const normalizedFilePath = path.normalize(filePath);
      const safeUploadsDir = path.normalize(path.join(__dirname, '..', 'uploads', 'products'));
      
      // Simple path check to prevent traversing outside
      if (!fs.existsSync(normalizedFilePath)) {
        console.log(` -> ERROR: Missing local file at ${normalizedFilePath}`);
        missingFiles++;
        continue;
      }

      if (isDryRun) {
        console.log(` -> DRY RUN: Would upload ${normalizedFilePath} and update DB.`);
        migrated++;
        continue;
      }

      // REAL RUN
      try {
        const fileBuffer = fs.readFileSync(normalizedFilePath);
        const originalName = path.basename(normalizedFilePath);
        
        console.log(` -> Uploading to ImageKit...`);
        const uploadResult = await imageService.uploadProductImage(fileBuffer, originalName);
        
        console.log(` -> Updating database...`);
        const updateResult = await query(
          'UPDATE products SET image_url = ?, image_file_id = ? WHERE id = ?',
          [uploadResult.secure_url, uploadResult.fileId, product.id]
        );

        if (Number(updateResult.affectedRows) === 0) {
           console.log(` -> ERROR: Failed to update DB. Rolling back ImageKit upload.`);
           await imageService.deleteProductImage(uploadResult.fileId);
           failedDbUpdates++;
        } else {
           console.log(` -> SUCCESS: Migrated to ${uploadResult.secure_url}`);
           migrated++;
        }
      } catch (err) {
        console.log(` -> ERROR: Upload failed. ${err.message}`);
        failedUploads++;
      }
    }

    console.log('\n==================================================');
    console.log('FINAL REPORT');
    console.log('==================================================');
    console.log(`Total Inspected:  ${products.length}`);
    console.log(`Migrated:         ${migrated}`);
    console.log(`Skipped:          ${skipped}`);
    console.log(`Missing Files:    ${missingFiles}`);
    console.log(`Failed Uploads:   ${failedUploads}`);
    console.log(`Failed DB Updates:${failedDbUpdates}`);
    console.log(`\nNOTE: Local files were NOT deleted.`);
    
    if (isDryRun) {
      console.log(`\nThis was a DRY RUN. No real modifications occurred.`);
    }

    process.exit(0);

  } catch (err) {
    console.error('Migration crashed:', err.message);
    process.exit(1);
  }
};

migrate();
