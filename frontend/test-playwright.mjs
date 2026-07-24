import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Go to local frontend
  await page.goto('http://localhost:5173');
  
  // Login
  await page.click('button:has-text("Admin Portal")'); // adjust based on actual login path
  // we will just directly call api using evaluate
  
  await page.evaluate(async () => {
    // Generate valid FormData
    const formData = new FormData();
    formData.append('name', 'Browser Test');
    formData.append('price', '99');
    formData.append('category_id', '29');
    formData.append('is_available', '1');
    
    // Send directly using fetch to avoid token requirement, or just see if it hangs
    // Since we removed authMiddleware in backend, it should go through!
    try {
      console.log('Sending from browser context...');
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        body: formData,
      });
      console.log('Response status:', res.status);
    } catch (e) {
      console.error('Fetch failed:', e);
    }
  });

  // Read console logs from page
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));

  await page.waitForTimeout(15000); // wait for 10s timeout
  await browser.close();
})();
