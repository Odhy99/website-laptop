document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    // Periksa apakah token ada
    if (!token) {
        alert('Anda belum login. Silakan login terlebih dahulu.');
        window.location.href = '/login.html'; // Redirect ke halaman login
        return;
    }

    // Jika token ada, lanjutkan menampilkan dashboard
    fetchBanners(); // Panggil fungsi fetchBanners() saat halaman dimuat

    // Jika token ada, lanjutkan menampilkan dashboard
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => {
                addProductToDOM(product);
            });
        });
});

document.addEventListener('DOMContentLoaded', () => {
    const productForm = document.getElementById('productForm');
    const productList = document.getElementById('productList');
    const showProductFormButton = document.getElementById('showProductForm');
    const productModal = document.getElementById('productModal'); // Modal
    const closeModalButton = document.querySelector('.close-modal'); // Tombol close (x) di modal
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resetSearch = document.getElementById('resetSearch');

    // Inisialisasi variabel untuk banner
    const bannerForm = document.getElementById('bannerForm');
    const bannerList = document.getElementById('bannerList');
    const showBannerFormButton = document.getElementById('showBannerForm');
    const bannerModal = document.getElementById('bannerModal');
    const closeBannerModalButton = document.querySelector('.close-banner-modal');

    // Tampilkan modal saat tombol "Tambah Banner" ditekan
    showBannerFormButton.addEventListener('click', () => {
        bannerModal.style.display = 'block';
    });

    // Sembunyikan modal saat tombol close (x) ditekan
    closeBannerModalButton.addEventListener('click', () => {
        bannerModal.style.display = 'none';
    });

    // Sembunyikan modal saat area di luar modal diklik
    window.addEventListener('click', (e) => {
        if (e.target === bannerModal) {
            bannerModal.style.display = 'none';
        }
    });

    // Fetch dan tampilkan banner dari backend
    fetchBanners();

    // Tambahkan banner baru
    bannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(); // Buat objek FormData
        const bannerImage = document.getElementById('bannerImage').files[0]; // Ambil file gambar
        const bannerLink = document.getElementById('bannerLink').value; // Ambil tautan banner

        // Validasi: Pastikan file gambar diupload
        if (!bannerImage) {
            alert('Harap upload gambar banner!');
            return;
        }

        // Tambahkan file dan data ke FormData
        formData.append('image', bannerImage); // Key 'image' harus sesuai dengan yang diharapkan oleh backend
        formData.append('link', bannerLink); // Key 'link' untuk tautan banner

        try {
            // Kirim data ke backend
            const response = await fetch('/api/banners', {
                method: 'POST',
                body: formData, // Kirim FormData, bukan JSON
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`, // Sertakan token JWT
                },
            });

            if (response.ok) {
                const banner = await response.json();
                addBannerToDOM(banner);
                bannerForm.reset();
                bannerModal.style.display = 'none';
            } else {
                const errorData = await response.json();
                alert(`Gagal menambahkan banner: ${errorData.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengupload gambar atau menambahkan banner.');
        }
    });

    // Fungsi untuk mengambil dan menampilkan banner
    async function fetchBanners() {
        try {
            const response = await fetch('/api/banners');
            if (!response.ok) {
                throw new Error('Gagal mengambil data banner');
            }
            const banners = await response.json();
            displayBanners(banners); // Tampilkan banner
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Fungsi untuk menampilkan banner ke DOM
    function displayBanners(banners) {
        const bannerList = document.getElementById('bannerList');
        bannerList.innerHTML = ''; // Kosongkan daftar banner sebelum menambahkan yang baru

        banners.forEach(banner => {
            addBannerToDOM(banner);
        });
    }

    // Fungsi untuk menambahkan banner ke DOM
    function addBannerToDOM(banner) {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${banner.image}" alt="Banner" width="100">
            <a href="${banner.link}" target="_blank">${banner.link}</a>
            <button class="delete-banner-btn" data-id="${banner.id}">Hapus</button>
        `;

        // Event listener untuk tombol hapus
        const deleteButton = li.querySelector('.delete-banner-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                deleteBanner(banner.id);
            });
        }

        bannerList.appendChild(li);
    }

    // Fungsi untuk menghapus banner
    async function deleteBanner(bannerId) {
        try {
            const response = await fetch(`/api/banners/${bannerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                // Hapus banner dari DOM
                const bannerElement = document.querySelector(`.delete-banner-btn[data-id="${bannerId}"]`).parentElement;
                if (bannerElement) {
                    bannerElement.remove();
                }
                console.log('Banner berhasil dihapus');
            } else {
                const errorData = await response.json();
                console.error('Gagal menghapus banner:', errorData.error);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Tampilkan modal saat tombol "Tambah Produk" ditekan
    showProductFormButton.addEventListener('click', () => {
        productModal.style.display = 'block'; // Tampilkan modal
    });

    // Sembunyikan modal saat tombol close (x) ditekan
    closeModalButton.addEventListener('click', () => {
        productModal.style.display = 'none'; // Sembunyikan modal
    });

    // Sembunyikan modal saat area di luar modal diklik
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none'; // Sembunyikan modal
        }
    });

    // Fetch and display products
    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => {
                addProductToDOM(product);
            });
        });

    // Add new product
 document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Ambil data dari form
    const formData = new FormData(e.target);
    const productData = {
        nama: formData.get('nama'),
        harga: formData.get('harga'),
        spesifikasi: formData.get('spesifikasi'),
        status: formData.get('status'),
        deskripsi: formData.get('deskripsi'),
    };

    // Ambil file gambar utama
    const imageFile = formData.get('gambar');

    try {
        // Upload gambar utama ke Cloudinary
        const imageUrl = await uploadImage(imageFile);

        // Tambahkan URL gambar utama ke data produk
        productData.gambar = imageUrl;

        // Ambil file gambar tambahan (jika ada)
        const additionalImages = formData.getAll('gambarTambahan');
        const additionalImageUrls = [];
        for (let i = 0; i < additionalImages.length; i++) {
            const url = await uploadImage(additionalImages[i]);
            additionalImageUrls.push(url);
        }

        // Tambahkan URL gambar tambahan ke data produk
        productData.gambarTambahan = additionalImageUrls;

        // Kirim data produk ke backend
        const response = await fetch('/api/products', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
            body: JSON.stringify(productData),
        });

        if (response.ok) {
            const product = await response.json();
            addProductToDOM(product); // Tambahkan produk ke DOM
            e.target.reset(); // Reset form
        } else {
            const errorData = await response.json();
            alert(`Gagal menambahkan produk: ${errorData.error || 'Terjadi kesalahan'}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Terjadi kesalahan saat menambahkan produk.');
    }
});
    
    // Fungsi untuk upload gambar ke Cloudinary
    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            return data.url; // URL gambar dari Cloudinary
        } else {
            throw new Error('Gagal mengupload gambar');
        }
    }

    // Fungsi untuk menambahkan produk ke DOM
    function addProductToDOM(product) {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${product.gambar}" alt="${product.nama}" width="100">
            <h3 class="product-name">${product.nama}</h3>
            <p>${product.harga}</p>
            <p>${product.status}</p>
            <button class="edit-btn" data-id="${product.id}">Edit</button>
            <button class="delete-btn" data-id="${product.id}">Hapus</button>
        `;

        // Event listener untuk tombol hapus
        const deleteButton = li.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                showDeleteConfirmationModal(product.id); // Tampilkan modal konfirmasi hapus
            });
        }

        // Event listener untuk tombol edit
        const editButton = li.querySelector('.edit-btn');
        if (editButton) {
            editButton.addEventListener('click', function () {
                showEditForm(product); // Panggil fungsi edit
            });
        }

        productList.appendChild(li);
    }

    // Fungsi untuk menampilkan modal konfirmasi hapus
    function showDeleteConfirmationModal(productId) {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        deleteModal.style.display = 'block'; // Tampilkan modal
        productIdToDelete = productId; // Simpan ID produk yang akan dihapus
    }

    // Fungsi untuk menyembunyikan modal konfirmasi hapus
    function hideDeleteConfirmationModal() {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        deleteModal.style.display = 'none'; // Sembunyikan modal
        productIdToDelete = null; // Reset ID produk
    }

    // Event listener untuk tombol "Ya, Hapus"
    document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
        if (productIdToDelete) {
            try {
                const response = await fetch(`/api/products/${productIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}` // Sertakan token di header
                    },
                });

                if (response.ok) {
                    // Hapus produk dari DOM
                    const productElement = document.querySelector(`.delete-btn[data-id="${productIdToDelete}"]`).parentElement;
                    if (productElement) {
                        productElement.remove();
                    }
                    console.log('Produk berhasil dihapus');
                } else {
                    const errorData = await response.json();
                    console.error('Gagal menghapus produk:', errorData.error);
                }
            } catch (error) {
                console.error('Error:', error);
            } finally {
                hideDeleteConfirmationModal();
            }
        }
    });

    // Event listener untuk tombol "Batal"
    document.getElementById('cancelDeleteButton').addEventListener('click', () => {
        hideDeleteConfirmationModal(); // Sembunyikan modal
    });

    // Event listener untuk tombol close (x) di modal
    document.querySelector('.close-delete-modal').addEventListener('click', () => {
        hideDeleteConfirmationModal(); // Sembunyikan modal
    });

    // Event listener untuk area di luar modal
    window.addEventListener('click', (e) => {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        if (e.target === deleteModal) {
            hideDeleteConfirmationModal(); // Sembunyikan modal
        }
    });

    // Fungsi untuk menampilkan form edit dalam modal
    function showEditForm(product) {
        const editModal = document.getElementById('editModal'); // Modal edit
        const editForm = document.getElementById('editForm'); // Form edit
        const closeEditModalButton = document.querySelector('.close-edit-modal'); // Tombol close (x) di modal edit

        // Isi form dengan data produk yang akan diedit
        document.getElementById('editProductName').value = product.nama;
        document.getElementById('editProductSpecs').value = product.spesifikasi;
        document.getElementById('editProductPrice').value = product.harga;
        document.getElementById('editProductStatus').value = product.status;
        document.getElementById('editProductDescription').value = product.deskripsi;

        // Nonaktifkan input file untuk gambar utama dan gambar tambahan
        document.getElementById('editProductImage').disabled = true;
        document.getElementById('editAdditionalImages').disabled = true;

        // Sembunyikan input file untuk gambar utama dan gambar tambahan
        document.getElementById('editProductImage').style.display = 'none';
        document.getElementById('editAdditionalImages').style.display = 'none';

        // Sembunyikan label untuk gambar utama dan gambar tambahan
        const editProductImageLabel = document.querySelector('label[for="editProductImage"]');
        const editAdditionalImagesLabel = document.querySelector('label[for="editAdditionalImages"]');
        if (editProductImageLabel) editProductImageLabel.style.display = 'none';
        if (editAdditionalImagesLabel) editAdditionalImagesLabel.style.display = 'none';

        // Tampilkan modal edit
        editModal.style.display = 'block';

        // Event listener untuk form edit
        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProduct(product.id); // Panggil fungsi update
        });

        // Event listener untuk tombol batal
        const cancelEditButton = document.getElementById('cancelEdit');
        if (cancelEditButton) {
            cancelEditButton.addEventListener('click', function () {
                editModal.style.display = 'none'; // Sembunyikan modal edit
            });
        }

        // Sembunyikan modal saat tombol close (x) ditekan
        closeEditModalButton.addEventListener('click', () => {
            editModal.style.display = 'none'; // Sembunyikan modal edit
        });

        // Sembunyikan modal saat area di luar modal diklik
        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none'; // Sembunyikan modal edit
            }
        });
    }

    // Fungsi untuk mengupdate produk
    async function updateProduct(productId) {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');

        // Ambil data dari form edit
        const updatedProduct = {
            nama: document.getElementById('editProductName').value,
            spesifikasi: document.getElementById('editProductSpecs').value,
            harga: document.getElementById('editProductPrice').value,
            status: document.getElementById('editProductStatus').value,
            deskripsi: document.getElementById('editProductDescription').value,
        };

        try {
            // Kirim permintaan PUT ke backend
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}` // Sertakan token di header
                },
                body: JSON.stringify(updatedProduct),
            });

            if (response.ok) {
                const updatedProductData = await response.json();

                // Perbarui produk di DOM
                const productElement = document.querySelector(`.edit-btn[data-id="${productId}"]`).parentElement;
                if (productElement) {
                    productElement.innerHTML = `
                        <img src="${updatedProductData.gambar}" alt="${updatedProductData.nama}" width="100">
                        <h3 class="product-name">${updatedProductData.nama}</h3>
                        <p>${updatedProductData.harga}</p>
                        <p>${updatedProductData.status}</p>
                        <button class="edit-btn" data-id="${updatedProductData.id}">Edit</button>
                        <button class="delete-btn" data-id="${updatedProductData.id}">Hapus</button>
                    `;

                    // Pasang ulang event listener untuk tombol edit dan hapus
                    const editButton = productElement.querySelector('.edit-btn');
                    const deleteButton = productElement.querySelector('.delete-btn');

                    if (editButton) {
                        editButton.addEventListener('click', function () {
                            showEditForm(updatedProductData);
                        });
                    }

                    if (deleteButton) {
                        deleteButton.addEventListener('click', function () {
                            showDeleteConfirmationModal(updatedProductData.id);
                        });
                    }
                }

                editModal.style.display = 'none'; // Sembunyikan modal edit
                console.log('Produk berhasil diupdate');
            } else {
                console.error('Gagal mengupdate produk:', await response.text());
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    // Fungsi untuk memperbarui daftar produk
    function refreshProductList() {
        productList.innerHTML = ''; // Kosongkan daftar produk
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                products.forEach(product => {
                    addProductToDOM(product); // Tambahkan produk ke DOM
                });
            });
    }

    // Fungsi untuk mencari produk
    function searchProducts(keyword) {
        const products = productList.children;
        keyword = keyword.toLowerCase();

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const productName = product.querySelector('.product-name').textContent.toLowerCase();

            if (productName.includes(keyword)) {
                product.style.display = 'flex'; // Tampilkan produk yang cocok
            } else {
                product.style.display = 'none'; // Sembunyikan produk yang tidak cocok
            }
        }
    }

    // Event listener untuk tombol search
    searchButton.addEventListener('click', () => {
        const keyword = searchInput.value;
        searchProducts(keyword);
    });

    // Event listener untuk input search (live search)
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value;
        searchProducts(keyword);
    });

    // Event listener untuk tombol reset
    resetSearch.addEventListener('click', () => {
        searchInput.value = ''; // Kosongkan input
        const products = productList.children;

        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'flex'; // Tampilkan semua produk
        }
    });
});
