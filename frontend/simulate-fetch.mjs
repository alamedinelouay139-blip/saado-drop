import { File, FormData } from 'formdata-node';
import fetch from 'node-fetch';
import fs from 'fs';

async function run() {
  const formData = new FormData();
  formData.append('name', 'Test Browser Simulation');
  formData.append('price', '15');
  formData.append('category_id', '29');
  formData.append('is_available', '1');
  
  const buffer = fs.readFileSync('./test.jpg');
  formData.append('image', new File([buffer], 'test.jpg', { type: 'image/jpeg' }));
  
  console.log('Sending fetch request...');
  try {
    const res = await fetch('http://localhost:5000/api/products', {
      method: 'POST',
      body: formData,
    });
    
    console.log('Response status:', res.status);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

run();
