const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dkfue0nxr', // Ganti dengan cloud name Anda
  api_key: '616948257564696', // Ganti dengan API key Anda
  api_secret: '4J0PUP4V38r-z_7XWMbVxlwcnQY' // Ganti dengan API secret Anda
});

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'Public'))); // Folder untuk file statis

// Konfigurasi multer untuk menyimpan file di memori
const upload = multer({ storage: multer.memoryStorage() });

// Data pengguna (sementara)
const users = [
  { id: 1, username: 'admin', password: 'password123' }
];

// Middleware untuk memeriksa token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'rahasia', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    req.user = user;
    next();
  });
}

// Endpoint untuk login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'rahasia', { expiresIn: '1h' });
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
});

// Endpoint untuk upload gambar ke Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    // Upload gambar ke Cloudinary dari buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
      stream.end(req.file.buffer);
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
    res.status(500).json({ error: 'Gagal mengupload gambar' });
  }
});

// Route untuk root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

let products = []; // Simpan data produk di sini (sementara)

// Get all products
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add a new product
app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, description, price } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file gambar yang diupload' });
    }

    // Upload gambar ke Cloudinary dari buffer
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
      stream.end(req.file.buffer);
    });

    // Buat produk baru
    const newProduct = {
      id: Date.now().toString(),
      name,
      description,
      price: parseFloat(price),
      image: result.secure_url
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
});

// Delete a product
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;

  const productIndex = products.findIndex(product => product.id === productId);

  if (productIndex !== -1) {
    products.splice(productIndex, 1);
    res.status(204).send();
  } else {
    res.status(404).json({ error: 'Produk tidak ditemukan' });
  }
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
