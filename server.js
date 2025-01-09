const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Library untuk handle upload file
const path = require('path');
const jwt = require('jsonwebtoken'); // Library untuk membuat token JWT
const cloudinary = require('cloudinary').v2; // Library untuk Cloudinary
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // File statis bisa diakses tanpa proteksi

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dkfue0nxr', // Ganti dengan cloud name Anda
  api_key: '616948257564696',      // Ganti dengan API key Anda
  api_secret: '4J0PUP4V38r-z_7XWMbVxlwcnQY' // Ganti dengan API secret Anda
});

// Konfigurasi multer untuk upload file sementara
const upload = multer({ dest: 'temp/' }); // File sementara disimpan di folder 'temp'

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

    jwt.verify(token, 'rahasia', (err, user) => {
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
        const token = jwt.sign({ userId: user.id }, 'rahasia', { expiresIn: '1h' }); // Ganti 'rahasia' dengan secret key yang kuat
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
        // Upload file ke Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'laptop-products' // Folder di Cloudinary untuk menyimpan gambar
        });

        // Hapus file sementara setelah diunggah ke Cloudinary
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        // Kirim URL gambar dari Cloudinary
        res.json({ url: result.secure_url });
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({ error: 'Gagal mengunggah gambar' });
    }
});

let products = []; // Simpan data produk di sini (sementara)

// Get all products (tidak memerlukan autentikasi)
app.get('/api/products', (req, res) => {
    res.json(products);
});

// Add a new product (memerlukan autentikasi)
app.post('/api/products', authenticateToken, (req, res) => {
    const product = req.body;
    products.push(product);
    res.status(201).json(product);
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

// Update a product (memerlukan autentikasi)
app.put('/api/products/:id', authenticateToken, (req, res) => {
    const productId = req.params.id;

    // Cari produk yang akan diupdate
    const productIndex = products.findIndex(product => product.id === productId);

    if (productIndex !== -1) {
        const updatedProduct = req.body;
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

    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    try {
        // Upload gambar ke Cloudinary
        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'banners' // Folder di Cloudinary untuk menyimpan banner
        });

        // Hapus file sementara setelah diunggah ke Cloudinary
        const fs = require('fs');
        fs.unlinkSync(req.file.path);

        const newBanner = {
            id: Date.now().toString(), // ID unik
            image: result.secure_url, // URL gambar dari Cloudinary
            link: link,
        };

        banners.push(newBanner);
        res.status(201).json(newBanner);
    } catch (error) {
        console.error('Error uploading banner:', error);
        res.status(500).json({ error: 'Gagal mengunggah banner' });
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
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Jalankan server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
