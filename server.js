const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Library untuk handle upload file
const path = require('path');
const jwt = require('jsonwebtoken'); // Library untuk membuat token JWT
const cloudinary = require('cloudinary').v2; // Library untuk Cloudinary
const { Client } = require('pg'); // Library untuk CockroachDB
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'Public'))); // File statis bisa diakses tanpa proteksi

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dkfue0nxr', // Gunakan environment variable
  api_key: process.env.CLOUDINARY_API_KEY || '616948257564696', // Gunakan environment variable
  api_secret: process.env.CLOUDINARY_API_SECRET || '4J0PUP4V38r-z_7XWMbVxlwcnQY' // Gunakan environment variable
});

// Konfigurasi multer untuk upload file sementara
const upload = multer({ storage: multer.memoryStorage() }); // Simpan file di memori, bukan di disk

// Konfigurasi CockroachDB
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'your_cockroachdb_connection_string' // Gunakan environment variable
});
client.connect()
  .then(() => console.log('Connected to CockroachDB'))
  .catch(err => console.error('Connection error', err.stack));

// Data pengguna (sementara, bisa diganti dengan database)
const users = [
  { id: 1, username: 'admin', password: 'password123' } // Ganti dengan username dan password Anda
];

// Middleware untuk memeriksa token JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'rahasia', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token tidak valid' });
    }
    req.user = user; // Simpan data user di request object
    next(); // Lanjut ke endpoint berikutnya
  });
}

// Route untuk halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'index.html'));
});

// Endpoint untuk login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Cari pengguna berdasarkan username dan password
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Buat token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'rahasia', { expiresIn: '1h' }); // Gunakan environment variable
    res.json({ success: true, token }); // Kirim token ke client
  } else {
    res.status(401).json({ success: false, message: 'Username atau password salah' });
  }
});

// Endpoint untuk upload gambar ke Cloudinary
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diupload' });
  }

  try {
    // Upload file ke Cloudinary langsung dari buffer
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'laptop-products' }, // Folder di Cloudinary
      (error, result) => {
        if (error) {
          console.error('Error uploading image:', error);
          return res.status(500).json({ error: 'Gagal mengunggah gambar' });
        }
        // Kirim URL gambar dari Cloudinary
        res.json({ url: result.secure_url });
      }
    ).end(req.file.buffer); // Gunakan buffer dari file yang diupload
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal mengunggah gambar' });
  }
});

// Get all products (tidak memerlukan autentikasi)
app.get('/api/products', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Gagal mengambil data produk' });
  }
});

// Add a new product (memerlukan autentikasi)
app.post('/api/products', authenticateToken, async (req, res) => {
  const { name, price, description, image_url } = req.body;

  try {
    const query = `
      INSERT INTO products (name, price, description, image_url)
      VALUES ($1, $2, $3, $4)
      RETURNING *`;
    const values = [name, price, description, image_url];
    const result = await client.query(query, values);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
});

// Delete a product (memerlukan autentikasi)
app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const productId = req.params.id;

  try {
    const query = 'DELETE FROM products WHERE id = $1';
    const values = [productId];
    await client.query(query, values);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Gagal menghapus produk' });
  }
});

// Update a product (memerlukan autentikasi)
app.put('/api/products/:id', authenticateToken, async (req, res) => {
  const productId = req.params.id;
  const { name, price, description, image_url } = req.body;

  try {
    const query = `
      UPDATE products
      SET name = $1, price = $2, description = $3, image_url = $4
      WHERE id = $5
      RETURNING *`;
    const values = [name, price, description, image_url, productId];
    const result = await client.query(query, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Gagal mengupdate produk' });
  }
});

// Get all banners (tidak memerlukan autentikasi)
app.get('/api/banners', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM banners');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({ error: 'Gagal mengambil data banner' });
  }
});

// Add a new banner (memerlukan autentikasi)
app.post('/api/banners', authenticateToken, upload.single('image'), async (req, res) => {
  const { link } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'Tidak ada file yang diupload' });
  }

  try {
    // Upload gambar ke Cloudinary langsung dari buffer
    const result = await cloudinary.uploader.upload_stream(
      { folder: 'banners' }, // Folder di Cloudinary
      async (error, result) => {
        if (error) {
          console.error('Error uploading banner:', error);
          return res.status(500).json({ error: 'Gagal mengunggah banner' });
        }

        const query = `
          INSERT INTO banners (image_url, link)
          VALUES ($1, $2)
          RETURNING *`;
        const values = [result.secure_url, link];
        const dbResult = await client.query(query, values);
        res.status(201).json(dbResult.rows[0]);
      }
    ).end(req.file.buffer); // Gunakan buffer dari file yang diupload
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal mengunggah banner' });
  }
});

// Delete a banner (memerlukan autentikasi)
app.delete('/api/banners/:id', authenticateToken, async (req, res) => {
  const bannerId = req.params.id;

  try {
    const query = 'DELETE FROM banners WHERE id = $1';
    const values = [bannerId];
    await client.query(query, values);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({ error: 'Gagal menghapus banner' });
  }
});

// Proteksi halaman dashboard
app.get('/dashboard.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'Public', 'dashboard.html'));
});

// Jalankan server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
