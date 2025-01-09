document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Anda belum login. Silakan login terlebih dahulu.');
        window.location.href = '/login.html';
        return;
    }

    fetchBanners();

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
    const productModal = document.getElementById('productModal');
    const closeModalButton = document.querySelector('.close-modal');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const resetSearch = document.getElementById('resetSearch');

    const bannerForm = document.getElementById('bannerForm');
    const bannerList = document.getElementById('bannerList');
    const showBannerFormButton = document.getElementById('showBannerForm');
    const bannerModal = document.getElementById('bannerModal');
    const closeBannerModalButton = document.querySelector('.close-banner-modal');

    showBannerFormButton.addEventListener('click', () => {
        bannerModal.style.display = 'block';
    });

    closeBannerModalButton.addEventListener('click', () => {
        bannerModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === bannerModal) {
            bannerModal.style.display = 'none';
        }
    });

    fetchBanners();

    bannerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        const bannerImage = document.getElementById('bannerImage').files[0];
        const bannerLink = document.getElementById('bannerLink').value;

        if (!bannerImage) {
            alert('Harap upload gambar banner!');
            return;
        }

        formData.append('image', bannerImage);
        formData.append('link', bannerLink);

        try {
            const response = await fetch('/api/banners', {
                method: 'POST',
                body: formData,
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
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

    async function fetchBanners() {
        try {
            const response = await fetch('/api/banners');
            if (!response.ok) {
                throw new Error('Gagal mengambil data banner');
            }
            const banners = await response.json();
            displayBanners(banners);
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function displayBanners(banners) {
        const bannerList = document.getElementById('bannerList');
        bannerList.innerHTML = '';

        banners.forEach(banner => {
            addBannerToDOM(banner);
        });
    }

    function addBannerToDOM(banner) {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${banner.image}" alt="Banner" width="100">
            <a href="${banner.link}" target="_blank">${banner.link}</a>
            <button class="delete-banner-btn" data-id="${banner.id}">Hapus</button>
        `;

        const deleteButton = li.querySelector('.delete-banner-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                deleteBanner(banner.id);
            });
        }

        bannerList.appendChild(li);
    }

    async function deleteBanner(bannerId) {
        try {
            const response = await fetch(`/api/banners/${bannerId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
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

    showProductFormButton.addEventListener('click', () => {
        productModal.style.display = 'block';
    });

    closeModalButton.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    fetch('/api/products')
        .then(response => response.json())
        .then(products => {
            products.forEach(product => {
                addProductToDOM(product);
            });
        });

    // Integrasi kode baru untuk upload gambar ke Cloudinary
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Ambil token dari localStorage
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login. Silakan login terlebih dahulu.');
            window.location.href = '/login.html';
            return;
        }

        // Ambil data dari form
        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const imageFile = document.getElementById('productImage').files[0];

        // Validasi input
        if (!name || !description || !price || !imageFile) {
            alert('Harap isi semua field dan upload gambar.');
            return;
        }

        // Buat FormData untuk mengirim file
        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('image', imageFile);

        try {
            // Kirim data ke endpoint /api/products
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                alert('Produk berhasil ditambahkan!');
                window.location.reload(); // Muat ulang halaman setelah berhasil
            } else {
                const errorData = await response.json();
                console.error('Error dari backend:', errorData);
                alert(`Gagal menambahkan produk: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengupload gambar atau menambahkan produk.');
        }
    });

    async function uploadImage(file) {
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            const data = await response.json();
            return data.url;
        } else {
            throw new Error('Gagal mengupload gambar');
        }
    }

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

        const deleteButton = li.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', function () {
                showDeleteConfirmationModal(product.id);
            });
        }

        const editButton = li.querySelector('.edit-btn');
        if (editButton) {
            editButton.addEventListener('click', function () {
                showEditForm(product);
            });
        }

        productList.appendChild(li);
    }

    function showDeleteConfirmationModal(productId) {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        deleteModal.style.display = 'block';
        productIdToDelete = productId;
    }

    function hideDeleteConfirmationModal() {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        deleteModal.style.display = 'none';
        productIdToDelete = null;
    }

    document.getElementById('confirmDeleteButton').addEventListener('click', async () => {
        if (productIdToDelete) {
            try {
                const response = await fetch(`/api/products/${productIdToDelete}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                });

                if (response.ok) {
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

    document.getElementById('cancelDeleteButton').addEventListener('click', () => {
        hideDeleteConfirmationModal();
    });

    document.querySelector('.close-delete-modal').addEventListener('click', () => {
        hideDeleteConfirmationModal();
    });

    window.addEventListener('click', (e) => {
        const deleteModal = document.getElementById('deleteConfirmationModal');
        if (e.target === deleteModal) {
            hideDeleteConfirmationModal();
        }
    });

    function showEditForm(product) {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');
        const closeEditModalButton = document.querySelector('.close-edit-modal');

        document.getElementById('editProductName').value = product.nama;
        document.getElementById('editProductSpecs').value = product.spesifikasi;
        document.getElementById('editProductPrice').value = product.harga;
        document.getElementById('editProductStatus').value = product.status;
        document.getElementById('editProductDescription').value = product.deskripsi;

        document.getElementById('editProductImage').disabled = true;
        document.getElementById('editAdditionalImages').disabled = true;

        document.getElementById('editProductImage').style.display = 'none';
        document.getElementById('editAdditionalImages').style.display = 'none';

        const editProductImageLabel = document.querySelector('label[for="editProductImage"]');
        const editAdditionalImagesLabel = document.querySelector('label[for="editAdditionalImages"]');
        if (editProductImageLabel) editProductImageLabel.style.display = 'none';
        if (editAdditionalImagesLabel) editAdditionalImagesLabel.style.display = 'none';

        editModal.style.display = 'block';

        editForm.addEventListener('submit', function (e) {
            e.preventDefault();
            updateProduct(product.id);
        });

        const cancelEditButton = document.getElementById('cancelEdit');
        if (cancelEditButton) {
            cancelEditButton.addEventListener('click', function () {
                editModal.style.display = 'none';
            });
        }

        closeEditModalButton.addEventListener('click', () => {
            editModal.style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.style.display = 'none';
            }
        });
    }

    async function updateProduct(productId) {
        const editModal = document.getElementById('editModal');
        const editForm = document.getElementById('editForm');

        const formData = new FormData();
        formData.append('nama', document.getElementById('editProductName').value);
        formData.append('spesifikasi', document.getElementById('editProductSpecs').value);
        formData.append('harga', document.getElementById('editProductPrice').value);
        formData.append('status', document.getElementById('editProductStatus').value);
        formData.append('deskripsi', document.getElementById('editProductDescription').value);

        const mainImageFile = document.getElementById('editProductImage').files[0];
        if (mainImageFile) {
            formData.append('gambar', mainImageFile);
        }

        const additionalImageFiles = document.getElementById('editAdditionalImages').files;
        for (let i = 0; i < additionalImageFiles.length; i++) {
            formData.append('gambarTambahan', additionalImageFiles[i]);
        }

        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData,
            });

            if (response.ok) {
                const updatedProductData = await response.json();

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

                editModal.style.display = 'none';
                console.log('Produk berhasil diupdate');
            } else {
                console.error('Gagal mengupdate produk:', await response.text());
            }
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function refreshProductList() {
        productList.innerHTML = '';
        fetch('/api/products')
            .then(response => response.json())
            .then(products => {
                products.forEach(product => {
                    addProductToDOM(product);
                });
            });
    }

    function searchProducts(keyword) {
        const products = productList.children;
        keyword = keyword.toLowerCase();

        for (let i = 0; i < products.length; i++) {
            const product = products[i];
            const productName = product.querySelector('.product-name').textContent.toLowerCase();

            if (productName.includes(keyword)) {
                product.style.display = 'flex';
            } else {
                product.style.display = 'none';
            }
        }
    }

    searchButton.addEventListener('click', () => {
        const keyword = searchInput.value;
        searchProducts(keyword);
    });

    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value;
        searchProducts(keyword);
    });

    resetSearch.addEventListener('click', () => {
        searchInput.value = '';
        const products = productList.children;

        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'flex';
        }
    });
});
