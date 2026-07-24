import express from 'express';
import multer from 'multer';
import { FormData } from 'formdata-node';
import fetch from 'node-fetch';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// The body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// A slow middleware (simulating auth DB query)
app.use(async (req, res, next) => {
  await new Promise(r => setTimeout(r, 100)); // 100ms delay
  next();
});

app.post('/api/products', (req, res, next) => {
  console.log('Before multer');
  next();
}, upload.single('image'), (req, res) => {
  console.log('Request reached controller!');
  res.status(200).json({ success: true });
});

const server = app.listen(5006, async () => {
  console.log('Test server running on 5006');
  
  const formData = new FormData();
  formData.append('name', 'Test');
  
  try {
    const res = await fetch('http://localhost:5006/api/products', {
      method: 'POST',
      body: formData,
    });
    console.log('Status:', res.status);
  } catch (err) {
    console.error('Fetch error:', err);
  }
  
  server.close();
});
