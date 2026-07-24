import express from 'express';
import multer from 'multer';
import { FormData, File } from 'formdata-node';
import fetch from 'node-fetch';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Add the suspected interfering middlewares
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.post('/api/products', upload.single('image'), (req, res) => {
  console.log('Request reached controller!');
  res.status(200).json({ success: true });
});

const server = app.listen(5005, async () => {
  console.log('Test server running on 5005');
  
  const formData = new FormData();
  formData.append('name', 'Test Browser Simulation');
  
  try {
    const res = await fetch('http://localhost:5005/api/products', {
      method: 'POST',
      body: formData,
    });
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text);
  } catch (err) {
    console.error('Fetch error:', err);
  }
  
  server.close();
});
