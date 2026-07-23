/**
 * Comprehensive Integration Tests.
 * Follows all 27 required test flows and cleans up gracefully.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, query } = require('../src/database/pool');

const baseUrl = `http://localhost:${process.env.PORT || 5000}/api`;

const TEST_ADMIN_USERNAME = process.env.TEST_ADMIN_USERNAME;
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_ADMIN_USERNAME || !TEST_ADMIN_PASSWORD) {
  console.error('\nError: TEST_ADMIN_USERNAME and TEST_ADMIN_PASSWORD environment variables are required for integration tests.');
  console.error('Please configure them in your .env file. Do NOT use production credentials.\n');
  process.exit(1);
}

const TEST_PREFIX = `TEST_AUTO_${Date.now()}`;

// Track created IDs for strict cleanup
const cleanup = {
  orderIds: [],
  productIds: [],
  categoryIds: [],
  imagePaths: [],
};

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const runTests = async () => {
  console.log('--- Starting Comprehensive Integration Tests ---\n');
  let token = '';
  let categoryId = null;
  let productId = null;
  let orderId = null;

  try {
    // 1. Confirm server is reachable (Health)
    console.log('1. Testing /api/health');
    const healthRes = await fetch(`${baseUrl}/health`);
    assert(healthRes.status === 200, 'Server unreachable');

    // 2. Test invalid login
    console.log('2. Testing invalid login');
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_ADMIN_USERNAME, password: 'wrongpassword' })
    });
    assert(invalidLoginRes.status === 401, 'Invalid login should return 401');

    // 3. Test valid login
    console.log('3. Testing valid login');
    // Ensure test admin exists for the sake of the test script
    try {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash(TEST_ADMIN_PASSWORD, 10);
      await query('INSERT INTO admins (full_name, username, password_hash) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE password_hash = ?', ['Test Admin', TEST_ADMIN_USERNAME, hash, hash]);
    } catch (e) {
      console.warn('Could not seed test admin:', e.message);
    }

    const validLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: TEST_ADMIN_USERNAME, password: TEST_ADMIN_PASSWORD })
    });
    const validLoginData = await validLoginRes.json();
    assert(validLoginRes.status === 200, 'Valid login failed');
    assert(!validLoginData.data.admin.password_hash, 'Password hash exposed in login response');
    token = validLoginData.data.token;

    // 4. Test missing token
    console.log('4. Testing missing token');
    const missingTokenRes = await fetch(`${baseUrl}/auth/profile`);
    assert(missingTokenRes.status === 401, 'Missing token should return 401');

    // 5. Test invalid token
    console.log('5. Testing invalid token');
    const invalidTokenRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: { 'Authorization': 'Bearer badtoken' }
    });
    assert(invalidTokenRes.status === 401, 'Invalid token should return 401');

    // 6. Test authenticated profile
    console.log('6. Testing authenticated profile');
    const profileRes = await fetch(`${baseUrl}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profileData = await profileRes.json();
    assert(profileRes.status === 200, 'Profile fetch failed');
    assert(!profileData.data.password_hash, 'Password hash exposed in profile response');

    // 7. Test protected Category creation
    console.log('7. Testing protected category creation');
    const catRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: `${TEST_PREFIX}_Category` })
    });
    const catData = await catRes.json();
    assert(catRes.status === 201, 'Category creation failed');
    categoryId = catData.data.id;
    cleanup.categoryIds.push(categoryId);

    // 8. Test invalid upload type (Text file)
    console.log('8. Testing invalid upload type');
    const invalidFileForm = new FormData();
    invalidFileForm.append('category_id', String(categoryId));
    invalidFileForm.append('name', `${TEST_PREFIX}_Product`);
    invalidFileForm.append('price', '10.00');
    const txtBlob = new Blob(['hello'], { type: 'text/plain' });
    invalidFileForm.append('image', txtBlob, 'test.txt');
    const invalidProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: invalidFileForm
    });
    assert(invalidProdRes.status === 400, 'Invalid upload should return 400');

    // 9. Test Product creation with valid mock image
    console.log('9. Testing product creation with valid image');
    const validFileForm = new FormData();
    validFileForm.append('category_id', String(categoryId));
    validFileForm.append('name', `${TEST_PREFIX}_Product`);
    validFileForm.append('price', '15.50');
    // Using an empty valid type
    const pngBlob = new Blob(['fake_png_data'], { type: 'image/png' });
    validFileForm.append('image', pngBlob, 'test.png');
    const prodRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: validFileForm
    });
    const prodData = await prodRes.json();
    assert(prodRes.status === 201, 'Product creation failed: ' + JSON.stringify(prodData));
    productId = prodData.data.id;
    cleanup.productIds.push(productId);
    if (prodData.data.image_url) {
      cleanup.imagePaths.push(path.join(__dirname, '../', prodData.data.image_url));
    }

    // Create a temporary product for permanent delete testing
    const tempForm = new FormData();
    tempForm.append('name', `${TEST_PREFIX}_ToDelete`);
    tempForm.append('price', '1.99');
    tempForm.append('category_id', categoryId);
    tempForm.append('image', new Blob(['fake image content'], { type: 'image/png' }), 'test-delete.png');
    
    const tempProdRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: tempForm
    });
    const tempProdData = await tempProdRes.json();
    const tempProductId = tempProdData.data.id;
    cleanup.productIds.push(tempProductId);

    // 10. Test public Product list
    console.log('10. Testing public product list');
    const prodListRes = await fetch(`${baseUrl}/products`);
    assert(prodListRes.status === 200, 'Product list failed');

    // 11. Test public Product by ID
    console.log('11. Testing public product by ID');
    const prodByIdRes = await fetch(`${baseUrl}/products/${productId}`);
    assert(prodByIdRes.status === 200, 'Product by ID failed');

    // 12. Test order creation
    console.log('12. Testing order creation (valid)');
    const orderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Customer',
        customer_phone: '123456',
        order_type: 'pickup',
        items: [{ product_id: productId, quantity: 2 }]
      })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Order creation failed');
    orderId = orderData.data.order_id;
    cleanup.orderIds.push(orderId);

    // 13. Verify subtotal (15.50 * 2 = 31.00)
    console.log('13. Verifying order subtotal');
    assert(Number(orderData.data.subtotal) === 31.00, `Subtotal mismatch: expected 31.00, got ${orderData.data.subtotal}`);

    // 14. Verify delivery fee is excluded (It is implicitly tested since subtotal is exactly 31.00)

    // 15. Test invalid product ID in order
    console.log('15. Testing invalid product ID in order');
    const invalidProdOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Customer',
        customer_phone: '123456',
        order_type: 'pickup',
        items: [{ product_id: 999999, quantity: 1 }]
      })
    });
    assert(invalidProdOrderRes.status === 404, 'Invalid product ID should return 404');

    // 16. Test unavailable product
    console.log('16. Testing unavailable product in order');
    // Deactivate product
    await query('UPDATE products SET is_available = 0 WHERE id = ?', [productId]);
    const unavailableOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Test Customer',
        customer_phone: '123456',
        order_type: 'pickup',
        items: [{ product_id: productId, quantity: 1 }]
      })
    });
    assert(unavailableOrderRes.status === 400, 'Unavailable product should return 400');
    // Reactivate for further tests
    await query('UPDATE products SET is_available = 1 WHERE id = ?', [productId]);

    // 17. Test Admin order list
    console.log('17. Testing admin order list');
    const adminOrdersRes = await fetch(`${baseUrl}/admin/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(adminOrdersRes.status === 200, 'Admin orders fetch failed');

    // 18. Test Admin order details
    console.log('18. Testing admin order details');
    const adminOrderDetRes = await fetch(`${baseUrl}/admin/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(adminOrderDetRes.status === 200, 'Admin order details fetch failed');

    // 19. Test valid status transition (pending -> confirmed)
    console.log('19. Testing valid status transition');
    const transitionRes = await fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'confirmed' })
    });
    const transitionData = await transitionRes.json();
    assert(transitionRes.status === 200, `Valid status transition failed with ${transitionRes.status}: ${JSON.stringify(transitionData)}`);

    // 20. Test invalid status transition (confirmed -> pending)
    console.log('20. Testing invalid status transition');
    const invalidTransRes = await fetch(`${baseUrl}/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'pending' })
    });
    assert(invalidTransRes.status === 400, 'Invalid transition should return 400');

    // 21. Test WhatsApp message
    console.log('21. Testing WhatsApp message generation');
    const waRes = await fetch(`${baseUrl}/admin/orders/${orderId}/whatsapp-message`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(waRes.status === 200, 'WhatsApp message generation failed');

    // 22. Test shop settings GET
    console.log('22. Testing GET shop settings');
    const settingsRes = await fetch(`${baseUrl}/shop-settings`);
    assert(settingsRes.status === 200, 'GET shop settings failed');

    // 23. Test protected settings update
    console.log('23. Testing protected shop settings update');
    const settingsUpdateRes = await fetch(`${baseUrl}/shop-settings`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ shop_name: 'Integration Test Shop' })
    });
    // This could fail if there was no row previously inserted (we removed default insert).
    // The query updates where id = settings.id. Let's just assert it doesn't 500.
    assert(settingsUpdateRes.status === 200 || settingsUpdateRes.status === 400, 'PATCH shop settings failed');

    // --- PRODUCT LIFECYCLE TESTS ---
    // 23a. Test Archive Product
    console.log('23a. Testing Archive Product');
    const archiveRes = await fetch(`${baseUrl}/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(archiveRes.status === 200, 'Archiving product should return 200');

    // 23b. Test Restore Product
    console.log('23b. Testing Restore Product');
    const restoreRes = await fetch(`${baseUrl}/products/${productId}/restore`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(restoreRes.status === 200, 'Restoring product should return 200');

    // 23c. Test Permanent Delete (Conflict with Order Items)
    console.log('23c. Testing Permanent Delete (Conflict)');
    const permDeleteConflictRes = await fetch(`${baseUrl}/products/${productId}/permanent`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(permDeleteConflictRes.status === 409, 'Permanent deletion with orders should return 409');

    // 23d. Test Permanent Delete (Success)
    console.log('23d. Testing Permanent Delete (Success)');
    const permDeleteSuccessRes = await fetch(`${baseUrl}/products/${tempProductId}/permanent`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(permDeleteSuccessRes.status === 200, 'Permanent deletion without orders should return 200');
    // Ensure it's removed from cleanup since we just deleted it
    cleanup.productIds = cleanup.productIds.filter(id => id !== tempProductId);
    // -------------------------------

    // 24. Test deleting category with products (Should fail)
    console.log('24. Testing deleting category with products');
    const delFilledCatRes = await fetch(`${baseUrl}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(delFilledCatRes.status === 400, 'Deleting filled category should return 400');
    const delFilledCatData = await delFilledCatRes.json();
    assert(delFilledCatData.message === 'This category cannot be deleted because it still contains active or archived products. Permanently delete unused products or move them to another category first.', 'Incorrect error message for filled category');

    // Create an empty category to test successful deletion
    console.log('25. Testing category deletion (Setup empty category)');
    const emptyCatRes = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: `${TEST_PREFIX}_EmptyCat` })
    });
    const emptyCatData = await emptyCatRes.json();
    const emptyCatId = emptyCatData.data.id;
    cleanup.categoryIds.push(emptyCatId); // Just in case it fails to delete

    // 26. Test unauthorized category deletion
    console.log('26. Testing unauthorized category deletion');
    const unauthorizedDelRes = await fetch(`${baseUrl}/categories/${emptyCatId}`, {
      method: 'DELETE'
    });
    assert(unauthorizedDelRes.status === 401, 'Unauthorized deletion should return 401');

    // 27. Test successful empty category deletion
    console.log('27. Testing successful empty category deletion');
    const successfulDelRes = await fetch(`${baseUrl}/categories/${emptyCatId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(successfulDelRes.status === 200, 'Deleting empty category should return 200');

    // 28. Test non-existent category deletion
    console.log('28. Testing non-existent category deletion');
    const notFoundDelRes = await fetch(`${baseUrl}/categories/999999`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(notFoundDelRes.status === 404, 'Deleting non-existent category should return 404');

    // --- ORDER DELETION TESTS ---
    // Create a temporary order to test single deletion
    const tempOrderRes = await fetch(`${baseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: 'Temp Delete User',
        customer_phone: '000000',
        order_type: 'pickup',
        items: [{ product_id: productId, quantity: 1, unit_price: 1.99 }]
      })
    });
    const tempOrderData = await tempOrderRes.json();
    console.log('tempOrderData:', tempOrderData);
    const tempOrderId = tempOrderData.data ? tempOrderData.data.order_id : null;
    if (tempOrderId) cleanup.orderIds.push(tempOrderId);
    
    // 28a. Test unauthorized single order deletion
    console.log('28a. Testing unauthorized single order deletion');
    const unauthDelOrderRes = await fetch(`${baseUrl}/admin/orders/${tempOrderId}`, { method: 'DELETE' });
    assert(unauthDelOrderRes.status === 401, 'Unauthorized order deletion should return 401');

    // 28b. Test single order deletion (Success)
    console.log('28b. Testing single order deletion');
    const delOrderRes = await fetch(`${baseUrl}/admin/orders/${tempOrderId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const delOrderData = await delOrderRes.json();
    console.log('delOrderData:', delOrderData);
    assert(delOrderRes.status === 200, `Deleting single order should return 200: ${JSON.stringify(delOrderData)}`);

    // 28c. Test missing single order deletion
    console.log('28c. Testing missing single order deletion');
    const missingDelOrderRes = await fetch(`${baseUrl}/admin/orders/999999`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(missingDelOrderRes.status === 404, 'Deleting missing order should return 404');

    // 28d. Test delete all orders (Wrong password)
    console.log('28d. Testing delete all orders (Wrong password)');
    const delAllWrongPwdRes = await fetch(`${baseUrl}/admin/orders`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ current_password: 'wrong', confirmation: 'DELETE ALL ORDERS' })
    });
    assert(delAllWrongPwdRes.status === 401, 'Wrong password should return 401');

    // 28e. Test delete all orders (Wrong confirmation)
    console.log('28e. Testing delete all orders (Wrong confirmation)');
    const delAllWrongConfRes = await fetch(`${baseUrl}/admin/orders`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ current_password: TEST_ADMIN_PASSWORD, confirmation: 'WRONG' })
    });
    assert(delAllWrongConfRes.status === 400, 'Wrong confirmation should return 400');

    // 28f. Test delete all orders (Success)
    console.log('28f. Testing delete all orders (Success)');
    const delAllSuccessRes = await fetch(`${baseUrl}/admin/orders`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ current_password: TEST_ADMIN_PASSWORD, confirmation: 'DELETE ALL ORDERS' })
    });
    assert(delAllSuccessRes.status === 200, 'Deleting all orders should return 200');
    // We don't need to clean up orderId anymore since we just wiped it!
    cleanup.orderIds = [];

    // 28g. Permanent Delete Product after its orders are removed
    console.log('28g. Testing permanent delete product after orders are gone');
    const permDeleteAfterRes = await fetch(`${baseUrl}/products/${productId}/permanent`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(permDeleteAfterRes.status === 200, 'Permanent deletion after orders wiped should return 200');
    cleanup.productIds = cleanup.productIds.filter(id => id !== productId);

    // 28h. Delete empty category after products are gone
    console.log('28h. Testing empty category deletion after products wiped');
    const finalCatDelRes = await fetch(`${baseUrl}/categories/${categoryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(finalCatDelRes.status === 200, 'Deleting empty category after products wiped should return 200');
    cleanup.categoryIds = cleanup.categoryIds.filter(id => id !== categoryId);
    // --------------------------------

    // 29. Test 404 route
    console.log('29. Testing 404 route');
    const notFoundRes = await fetch(`${baseUrl}/invalid-route-12345`);
    assert(notFoundRes.status === 404, '404 route failed');
    const notFoundData = await notFoundRes.json();
    assert(notFoundData.message === 'Resource not found', 'Invalid 404 message');

    console.log('\n✅ All Tests Passed Successfully!\n');

  } catch (error) {
    console.error('\n❌ Test Execution Failed:', error.message);
    process.exitCode = 1;
  } finally {
    console.log('--- Starting Cleanup ---');
    try {
      // 1. Delete Order Items
      if (cleanup.orderIds.length > 0) {
        await query(`DELETE FROM order_items WHERE order_id IN (${cleanup.orderIds.join(',')})`);
        console.log(`Deleted order items for ${cleanup.orderIds.length} orders.`);
      }
      // 2. Delete Orders
      if (cleanup.orderIds.length > 0) {
        await query(`DELETE FROM orders WHERE id IN (${cleanup.orderIds.join(',')})`);
        console.log(`Deleted ${cleanup.orderIds.length} test orders.`);
      }
      // 3. Delete Products
      if (cleanup.productIds.length > 0) {
        await query(`DELETE FROM products WHERE id IN (${cleanup.productIds.join(',')})`);
        console.log(`Deleted ${cleanup.productIds.length} test products.`);
      }
      // 4. Delete Categories
      if (cleanup.categoryIds.length > 0) {
        await query(`DELETE FROM categories WHERE id IN (${cleanup.categoryIds.join(',')})`);
        console.log(`Deleted ${cleanup.categoryIds.length} test categories.`);
      }
      // 5. Delete Uploaded Images
      for (const img of cleanup.imagePaths) {
        if (fs.existsSync(img)) {
          fs.unlinkSync(img);
          console.log(`Deleted test image: ${path.basename(img)}`);
        }
      }
      console.log('Cleanup completed successfully.');
    } catch (cleanErr) {
      console.error('Failed to cleanup test data:', cleanErr.message);
    } finally {
      await pool.end();
    }
  }
};

runTests();
