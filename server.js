const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Library untuk handle upload file
const path = require('path');
const fs = require('fs'); // Modul untuk menghapus file
const jwt = require('jsonwebtoken'); // Library untuk membuat token JWT
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
app.use(express.static(path.join(__dirname, 'Public'))); // Gunakan path absolut

// Konfigurasi multer untuk upload file sementara
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Folder untuk menyimpan file sementara
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nama file unik
  },
});

const upload = multer({ storage });

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

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

// Endpoint untuk login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // Cari pengguna berdasarkan username dan password
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Buat token JWT
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'rahasia', { expiresIn: '1h' }); // Ganti 'rahasia' dengan secret key yang kuat
    res.json({ success: true, token }); // Kirim token ke client
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

    // Upload gambar ke Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
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

// Get all products (tidak memerlukan autentikasi)
app.get('/api/products', (req, res) => {
  res.json(products);
});

// Add a new product (memerlukan autentikasi)
app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, description, price } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file gambar yang diupload' });
    }

    // Upload gambar ke Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const imageUrl = result.secure_url;

    // Buat produk baru
    const newProduct = {
      id: Date.now().toString(), // ID unik
      name,
      description,
      price: parseFloat(price),
      image: imageUrl
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal menambahkan produk' });
  }
});

// Delete a product (memerlukan autentikasi)
app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const productId = req.params.id;

  // Cari produk yang akan dihapus
  const productIndex = products.findIndex(product => product.id === productId);

  if (productIndex !== -1) {
    // Hapus produk dari array
    products.splice(productIndex, 1);
    res.status(204).send(); // Kirim respons sukses
  } else {
    res.status(404).json({ error: 'Produk tidak ditemukan' });
  }
});

// Update a product with file upload (memerlukan autentikasi)
app.put('/api/products/:id', authenticateToken, upload.fields([
  { name: 'gambar', maxCount: 1 }, // Field untuk foto utama (maksimal 1 file)
  { name: 'gambarTambahan', maxCount: 10 } // Field untuk foto tambahan (maksimal 10 file)
]), async (req, res) => {
  const productId = req.params.id;

  // Cari produk yang akan diupdate
  const productIndex = products.findIndex(product => product.id === productId);

  if (productIndex !== -1) {
    const updatedProduct = req.body;
    const product = products[productIndex];

    // Jika ada file gambar utama yang diupload
    if (req.files['gambar']) {
      // Upload gambar utama baru ke Cloudinary
      const result = await cloudinary.uploader.upload(req.files['gambar'][0].path);
      updatedProduct.gambar = result.secure_url; // Update URL gambar utama
    }

    // Jika ada file gambar tambahan yang diupload
    if (req.files['gambarTambahan']) {
      const gambarTambahanUrls = await Promise.all(
        req.files['gambarTambahan'].map(async (file) => {
          const result = await cloudinary.uploader.upload(file.path);
          return result.secure_url;
        })
      );
      updatedProduct.gambarTambahan = gambarTambahanUrls; // Update URL gambar tambahan
    }

    // Update data produk
    products[productIndex] = { ...products[productIndex], ...updatedProduct };
    res.json(products[productIndex]); // Kirim respons dengan data produk yang sudah diupdate
  } else {
    res.status(404).json({ error: 'Produk tidak ditemukan' });
  }
});

let banners = []; // Deklarasi variabel banners

// Get all banners (tidak memerlukan autentikasi)
app.get('/api/banners', (req, res) => {
  res.json(banners);
});

// Add a new banner (memerlukan autentikasi)
app.post('/api/banners', authenticateToken, upload.single('image'), async (req, res) => {
  const { link } = req.body;

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    // Upload gambar ke Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path);
    const imageUrl = result.secure_url;

    const newBanner = {
      id: Date.now().toString(), // ID unik
      image: imageUrl,
      link: link,
    };

    banners.push(newBanner);
    res.status(201).json(newBanner);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Gagal menambahkan banner' });
  }
});

// Delete a banner (memerlukan autentikasi)
app.delete('/api/banners/:id', authenticateToken, (req, res) => {
  const bannerId = req.params.id;

  // Cari banner yang akan dihapus
  const bannerIndex = banners.findIndex(banner => banner.id === bannerId);

  if (bannerIndex !== -1) {
    // Hapus banner dari array
    banners.splice(bannerIndex, 1);
    res.status(204).send(); // Kirim respons sukses
  } else {
    res.status(404).json({ error: 'Banner tidak ditemukan' });
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
