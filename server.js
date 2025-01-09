const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Konfigurasi Cloudinary
cloudinary.config({
  cloud_name: 'dkfue0nxr', // Ganti dengan cloud name Anda
  api_key: '616948257564696', // Ganti dengan API key Anda
  api_secret: '4J0PUP4V38r-z_7XWMbVxlwcnQY' // Ganti dengan API secret Anda
});

const app = express();
const upload = multer({ storage: multer.memoryStorage() }); // Simpan file di memori

// Endpoint untuk upload produk
app.post('/api/products', upload.single('image'), async (req, res) => {
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

        console.log('Cloudinary upload result:', result);

        // Buat produk baru
        const newProduct = {
            id: Date.now().toString(),
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            image: result.secure_url
        };

        // Simpan produk (sementara, bisa diganti dengan database)
        products.push(newProduct);
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Gagal menambahkan produk' });
    }
});

// Jalankan server
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
