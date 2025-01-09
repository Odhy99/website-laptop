const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const multer = require('multer'); // Library untuk handle upload file
const path = require('path');
const fs = require('fs'); // Modul untuk menghapus file
const jwt = require('jsonwebtoken'); // Library untuk membuat token JWT
const app = express();
const port = process.env.PORT || 3000;

// Buat folder uploads jika belum ada
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public'))); // Gunakan path absolut

// Konfigurasi multer untuk upload file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Folder untuk menyimpan file
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Nama file unik
    },
});

const upload = multer({ storage });

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

// Endpoint untuk upload gambar
app.post('/api/upload', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // URL gambar
    res.json({ url: imageUrl });
});

// Route untuk root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
        const product = products[productIndex];

        // Hapus gambar utama jika ada
        if (product.gambar) {
            const imagePath = path.join(__dirname, 'uploads', path.basename(product.gambar));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Hapus file gambar
            }
        }

        // Hapus gambar tambahan jika ada
        if (product.gambarTambahan && product.gambarTambahan.length > 0) {
            product.gambarTambahan.forEach(imageUrl => {
                const imagePath = path.join(__dirname, 'uploads', path.basename(imageUrl));
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath); // Hapus file gambar
                }
            });
        }

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
]), (req, res) => {
    const productId = req.params.id;

    // Cari produk yang akan diupdate
    const productIndex = products.findIndex(product => product.id === productId);

    if (productIndex !== -1) {
        const updatedProduct = req.body;
        const product = products[productIndex];

        // Jika ada file gambar utama yang diupload
        if (req.files['gambar']) {
            // Hapus gambar utama lama jika ada
            if (product.gambar) {
                // Ekstrak nama file dari URL gambar lama
                const oldImageName = path.basename(product.gambar);
                const oldImagePath = path.join(__dirname, 'uploads', oldImageName);

                // Periksa apakah file ada sebelum menghapus
                if (fs.existsSync(oldImagePath)) {
                    try {
                        fs.unlinkSync(oldImagePath); // Hapus file gambar lama
                        console.log(`Gambar utama lama dihapus: ${oldImagePath}`);
                    } catch (err) {
                        console.error(`Gagal menghapus gambar utama lama: ${err.message}`);
                    }
                } else {
                    console.warn(`Gambar utama lama tidak ditemukan: ${oldImagePath}`);
                }
            }

            // Simpan gambar utama baru
            const gambarUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files['gambar'][0].filename}`;
            updatedProduct.gambar = gambarUrl; // Update URL gambar utama
            console.log(`Gambar utama baru disimpan: ${gambarUrl}`);
        }

        // Jika ada file gambar tambahan yang diupload
        if (req.files['gambarTambahan']) {
            // Hapus gambar tambahan lama jika ada
            if (product.gambarTambahan && product.gambarTambahan.length > 0) {
                product.gambarTambahan.forEach(imageUrl => {
                    // Ekstrak nama file dari URL gambar tambahan lama
                    const oldImageName = path.basename(imageUrl);
                    const oldImagePath = path.join(__dirname, 'uploads', oldImageName);

                    // Periksa apakah file ada sebelum menghapus
                    if (fs.existsSync(oldImagePath)) {
                        try {
                            fs.unlinkSync(oldImagePath); // Hapus file gambar lama
                            console.log(`Gambar tambahan lama dihapus: ${oldImagePath}`);
                        } catch (err) {
                            console.error(`Gagal menghapus gambar tambahan lama: ${err.message}`);
                        }
                    } else {
                        console.warn(`Gambar tambahan lama tidak ditemukan: ${oldImagePath}`);
                    }
                });
            }

            // Simpan gambar tambahan baru
            const gambarTambahanUrls = req.files['gambarTambahan'].map(file => {
                return `${req.protocol}://${req.get('host')}/uploads/${file.filename}`;
            });
            updatedProduct.gambarTambahan = gambarTambahanUrls; // Update URL gambar tambahan
            console.log(`Gambar tambahan baru disimpan: ${gambarTambahanUrls.join(', ')}`);
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
app.post('/api/banners', authenticateToken, upload.single('image'), (req, res) => {
    const { link } = req.body;

    if (!req.file) {
        return res.status(400).json({ error: 'Tidak ada file yang diupload' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`; // URL gambar

    const newBanner = {
        id: Date.now().toString(), // ID unik
        image: imageUrl,
        link: link,
    };

    banners.push(newBanner);
    res.status(201).json(newBanner);
});

// Delete a banner (memerlukan autentikasi)
app.delete('/api/banners/:id', authenticateToken, (req, res) => {
    const bannerId = req.params.id;

    // Cari banner yang akan dihapus
    const bannerIndex = banners.findIndex(banner => banner.id === bannerId);

    if (bannerIndex !== -1) {
        const banner = banners[bannerIndex];

        // Hapus gambar banner jika ada
        if (banner.image) {
            const imagePath = path.join(__dirname, 'uploads', path.basename(banner.image));
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath); // Hapus file gambar
            }
        }

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
