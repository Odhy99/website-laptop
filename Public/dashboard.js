document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');

    if (!token) {
        alert('Anda belum login. Silakan login terlebih dahulu.');
        window.location.href = '/login.html';
        return;
    }

    fetchBanners();
    fetchProducts();

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

    // Tampilkan modal form produk
    showProductFormButton.addEventListener('click', () => {
        productModal.style.display = 'block';
    });

    // Tutup modal form produk
    closeModalButton.addEventListener('click', () => {
        productModal.style.display = 'none';
    });

    // Tutup modal form produk saat klik di luar modal
    window.addEventListener('click', (e) => {
        if (e.target === productModal) {
            productModal.style.display = 'none';
        }
    });

    // Handle submit form produk
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Anda belum login. Silakan login terlebih dahulu.');
            window.location.href = '/login.html';
            return;
        }

        const name = document.getElementById('productName').value;
        const description = document.getElementById('productDescription').value;
        const price = document.getElementById('productPrice').value;
        const imageFile = document.getElementById('productImage').files[0];

        if (!name || !description || !price || !imageFile) {
            alert('Harap isi semua field dan upload gambar.');
            return;
        }

        const formData = new FormData();
        formData.append('name', name);
        formData.append('description', description);
        formData.append('price', price);
        formData.append('image', imageFile);

        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (response.ok) {
                const newProduct = await response.json();
                addProductToDOM(newProduct);
                productForm.reset();
                productModal.style.display = 'none';
                alert('Produk berhasil ditambahkan!');
            } else {
                const errorData = await response.json();
                alert(`Gagal menambahkan produk: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengupload gambar atau menambahkan produk.');
        }
    });

    // Fungsi untuk menambahkan produk ke DOM
    function addProductToDOM(product) {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${product.image}" alt="${product.name}" width="100">
            <h3 class="product-name">${product.name}</h3>
            <p>${product.description}</p>
            <p>Rp ${product.price.toLocaleString()}</p>
            <button class="delete-btn" data-id="${product.id}">Hapus</button>
        `;

        const deleteButton = li.querySelector('.delete-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
                deleteProduct(product.id);
            });
        }

        productList.appendChild(li);
    }

    // Fungsi untuk menghapus produk
    async function deleteProduct(productId) {
        try {
            const response = await fetch(`/api/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
            });

            if (response.ok) {
                const productElement = document.querySelector(`.delete-btn[data-id="${productId}"]`).parentElement;
                if (productElement) {
                    productElement.remove();
                }
                alert('Produk berhasil dihapus!');
            } else {
                const errorData = await response.json();
                alert(`Gagal menghapus produk: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menghapus produk.');
        }
    }

    // Fungsi untuk mengambil data produk dari server
    async function fetchProducts() {
        try {
            const response = await fetch('/api/products');
            if (!response.ok) {
                throw new Error('Gagal mengambil data produk');
            }
            const products = await response.json();
            products.forEach(product => {
                addProductToDOM(product);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengambil data produk.');
        }
    }

    // Fungsi untuk mencari produk
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

    // Handle tombol search
    searchButton.addEventListener('click', () => {
        const keyword = searchInput.value;
        searchProducts(keyword);
    });

    // Handle input search
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value;
        searchProducts(keyword);
    });

    // Handle tombol reset search
    resetSearch.addEventListener('click', () => {
        searchInput.value = '';
        const products = productList.children;

        for (let i = 0; i < products.length; i++) {
            products[i].style.display = 'flex';
        }
    });

    // Tampilkan modal form banner
    showBannerFormButton.addEventListener('click', () => {
        bannerModal.style.display = 'block';
    });

    // Tutup modal form banner
    closeBannerModalButton.addEventListener('click', () => {
        bannerModal.style.display = 'none';
    });

    // Tutup modal form banner saat klik di luar modal
    window.addEventListener('click', (e) => {
        if (e.target === bannerModal) {
            bannerModal.style.display = 'none';
        }
    });

    // Handle submit form banner
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
                alert('Banner berhasil ditambahkan!');
            } else {
                const errorData = await response.json();
                alert(`Gagal menambahkan banner: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengupload gambar atau menambahkan banner.');
        }
    });

    // Fungsi untuk menambahkan banner ke DOM
    function addBannerToDOM(banner) {
        const li = document.createElement('li');
        li.innerHTML = `
            <img src="${banner.image}" alt="Banner" width="100">
            <a href="${banner.link}" target="_blank">${banner.link}</a>
            <button class="delete-banner-btn" data-id="${banner.id}">Hapus</button>
        `;

        const deleteButton = li.querySelector('.delete-banner-btn');
        if (deleteButton) {
            deleteButton.addEventListener('click', () => {
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
                const bannerElement = document.querySelector(`.delete-banner-btn[data-id="${bannerId}"]`).parentElement;
                if (bannerElement) {
                    bannerElement.remove();
                }
                alert('Banner berhasil dihapus!');
            } else {
                const errorData = await response.json();
                alert(`Gagal menghapus banner: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat menghapus banner.');
        }
    }

    // Fungsi untuk mengambil data banner dari server
    async function fetchBanners() {
        try {
            const response = await fetch('/api/banners');
            if (!response.ok) {
                throw new Error('Gagal mengambil data banner');
            }
            const banners = await response.json();
            banners.forEach(banner => {
                addBannerToDOM(banner);
            });
        } catch (error) {
            console.error('Error:', error);
            alert('Terjadi kesalahan saat mengambil data banner.');
        }
    }
});
