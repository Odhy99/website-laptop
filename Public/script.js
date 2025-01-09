
let laptops = []; // Array untuk menyimpan data produk dari backend

let images = []; // Array untuk menyimpan daftar gambar (gambar utama + gambar tambahan)
let currentImageIndex = 0; // Indeks gambar yang sedang ditampilkan

function fetchProducts() {
    fetch('/api/products') // Ambil data dari endpoint backend
        .then(response => response.json()) // Ubah respons ke JSON
        .then(data => {
            laptops = data; // Simpan data ke array `laptops`
            tampilkanBarang(currentPage); // Tampilkan produk
        })
        .catch(error => console.error('Error fetching products:', error));
}

document.addEventListener('DOMContentLoaded', function () {
    fetchProducts(); // Ambil data produk dari backend

    // Event listener untuk tombol close popup
    const closePopupButton = document.querySelector('.close-popup');
    if (closePopupButton) {
        closePopupButton.addEventListener('click', closePopup);
    }

    // Event listener untuk tombol search
    const searchButton = document.getElementById('search-button');
    if (searchButton) {
        searchButton.addEventListener('click', searchLaptops);
    }

    // Event listener untuk input search (bisa menggunakan Enter)
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                searchLaptops();
            }
        });
        // Tambahkan debounce untuk pencarian real-time
        let searchTimeout;
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(searchLaptops, 300); // Jalankan pencarian setelah 300ms
        });
    }

    // Event listener untuk filter brand dan harga
    const filterBrand = document.getElementById('filter-brand');
    const filterHarga = document.getElementById('filter-harga');

    if (filterBrand && filterHarga) {
        filterBrand.addEventListener('change', filterLaptops);
        filterHarga.addEventListener('change', filterLaptops);
    }


    // Fungsi untuk menutup popup saat mengklik di luar popup
document.addEventListener('click', function (event) {
    const popup = document.getElementById('popup');
    const popupContent = document.querySelector('.popup-content');

    // Cek apakah yang diklik adalah di luar popup (overlay)
    if (event.target === popup) {
        closePopup(); // Tutup popup
    }
});

    // Dynamic caption
    const captions = [
        'Hanya 3 Jutaan.',
        'untuk Mahasiswa.',
        'di Pulau Lombok.',
    ];

    const dynamicCaption = document.getElementById('dynamic-caption');
    let currentIndex = 0;

    function changeCaption() {
        // Tambahkan efek fade-out
        dynamicCaption.classList.remove('fade-in'); // Hapus fade-in sebelumnya
        dynamicCaption.classList.add('fade-out');

        setTimeout(() => {
            // Ganti teks setelah efek fade-out selesai
            currentIndex = (currentIndex + 1) % captions.length;
            dynamicCaption.innerHTML = captions[currentIndex];

            // Tambahkan efek fade-in
            dynamicCaption.classList.remove('fade-out');
            dynamicCaption.classList.add('fade-in');
        }, 1000); // Durasi fade-out (1 detik)
    }

    // Jalankan perubahan teks setiap 4 detik
    if (dynamicCaption) {
        setInterval(changeCaption, 4000);
    }
});

let currentPage = 1; // Halaman saat ini
const itemsPerPage = 6; // Jumlah produk per halaman

// Fungsi untuk menampilkan barang berdasarkan halaman
function tampilkanBarang(page) {
    const laptopCards = document.querySelector('.laptop-cards');
    laptopCards.innerHTML = ''; // Kosongkan konten sebelum menambahkan barang baru

    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const laptopsToShow = laptops.slice(startIndex, endIndex); // Ambil data untuk halaman tertentu

    laptopsToShow.forEach(laptop => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.setAttribute('data-description', laptop.deskripsi);
        card.setAttribute('data-images', JSON.stringify(laptop.gambarTambahan));

        card.innerHTML = `
            <img src="${laptop.gambar}" alt="${laptop.nama}">
            <h3>${laptop.nama}</h3>
            <p>${laptop.spesifikasi}</p>
            <p class="price">${laptop.harga}</p>
            <span class="status" data-status="${laptop.status}">${laptop.status}</span>
        `;

        laptopCards.appendChild(card);
    });

    // Pasang event listener untuk kartu laptop yang baru ditampilkan
    pasangEventListenersUntukKartu();
    // Update tombol pagination
    updatePaginationButtons();
}

// Fungsi untuk memasang event listener pada kartu laptop
function pasangEventListenersUntukKartu() {
    const laptopCards = document.querySelectorAll('.laptop-cards .card');

    laptopCards.forEach(card => {
        card.addEventListener('click', function () {
            const image = card.querySelector('img').src;
            const title = card.querySelector('h3').textContent;
            const specs = card.querySelector('p').textContent;
            const price = card.querySelector('.price').textContent;
            const description = card.getAttribute('data-description');
            const imageList = JSON.parse(card.getAttribute('data-images'));
            const status = card.querySelector('.status').getAttribute('data-status');

            showPopup(image, title, specs, price, description, imageList, status);
        });
    });
}

// Fungsi untuk membuat tombol pagination
function updatePaginationButtons() {
    const totalPages = Math.ceil(laptops.length / itemsPerPage); // Hitung total halaman
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const pageNumbersContainer = document.querySelector('.page-numbers');
    pageNumbersContainer.innerHTML = ''; // Kosongkan tombol nomor halaman sebelumnya

    // Update status tombol Previous dan Next
    prevButton.disabled = currentPage === 1; // Nonaktifkan tombol jika di halaman pertama
    nextButton.disabled = currentPage === totalPages; // Nonaktifkan tombol jika di halaman terakhir

    // Buat tombol nomor halaman
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.textContent = i;
        pageButton.classList.toggle('active', i === currentPage); // Tambahkan class active jika halaman aktif
        pageButton.addEventListener('click', () => {
            currentPage = i;
            tampilkanBarang(currentPage); // Perbarui tampilan barang
            updatePaginationButtons(); // Perbarui status tombol pagination

            // Scroll ke bagian atas kartu barang
            document.getElementById('laptop-cards').scrollIntoView({ behavior: 'smooth' });
        });
        pageNumbersContainer.appendChild(pageButton);
    }
}

// Event listener untuk tombol Previous
document.getElementById('prev-page').addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        tampilkanBarang(currentPage); // Perbarui tampilan barang
        updatePaginationButtons(); // Perbarui status tombol pagination

        // Scroll ke bagian atas kartu barang
        document.getElementById('laptop-cards').scrollIntoView({ behavior: 'smooth' });
    }
});

// Event listener untuk tombol Next
document.getElementById('next-page').addEventListener('click', () => {
    const totalPages = Math.ceil(laptops.length / itemsPerPage); // Hitung total halaman
    if (currentPage < totalPages) {
        currentPage++;
        tampilkanBarang(currentPage); // Perbarui tampilan barang
        updatePaginationButtons(); // Perbarui status tombol pagination

        // Scroll ke bagian atas kartu barang
        document.getElementById('laptop-cards').scrollIntoView({ behavior: 'smooth' });
    }
});

// Fungsi untuk menampilkan popup
function showPopup(image, title, specs, price, description, imageList, status) {
    const popup = document.getElementById('popup');
    const popupImage = popup.querySelector('.popup-image');
    const popupTitle = popup.querySelector('.popup-title');
    const popupSpecs = popup.querySelector('.popup-specs');
    const popupPrice = popup.querySelector('.popup-price');
    const popupStatus = popup.querySelector('.popup-status'); // Elemen untuk status
    const popupDescription = popup.querySelector('.popup-description');
    const buyButton = popup.querySelector('.popup-button');

    // Isi data ke dalam popup
    popupImage.src = image;
    popupTitle.textContent = title;
    popupSpecs.textContent = specs;
    popupPrice.textContent = price;
    popupStatus.textContent = status; // Tampilkan status
    popupDescription.textContent = description;
    buyButton.setAttribute('data-product', title); // Set nama produk untuk tombol "Beli Sekarang"

    // Tambahkan gambar utama ke awal daftar gambar
    images = [image, ...imageList]; // Gabungkan gambar utama dengan gambar tambahan
    currentImageIndex = 0; // Set indeks ke 0 (gambar utama)

    // Event listener untuk tombol "Tanyakan Langsung"
    buyButton.addEventListener('click', function () {
        const productName = buyButton.getAttribute('data-product'); // Ambil nama produk
        redirectToWhatsApp(productName); // Redirect ke WhatsApp
    });


    // Simpan daftar gambar dan reset index
    currentImageIndex = 0;

    // Event listener untuk tombol navigasi gambar
    const prevButton = popup.querySelector('.prev-button');
    const nextButton = popup.querySelector('.next-button');

     // Cek apakah ada gambar tambahan
     if (imageList && imageList.length > 0) {
        // Jika ada gambar tambahan, tampilkan tombol navigasi
        if (prevButton && nextButton) {
            prevButton.style.display = 'block';
            nextButton.style.display = 'block';

            prevButton.addEventListener('click', showPrevImage);
            nextButton.addEventListener('click', showNextImage);
        }
    } else {
        // Jika tidak ada gambar tambahan, sembunyikan tombol navigasi
        if (prevButton && nextButton) {
            prevButton.style.display = 'none';
            nextButton.style.display = 'none';
        }
    }

    // Handle "Read More" button
    const popupDescriptionContainer = popup.querySelector('.popup-description-container');
    const readMoreBtn = popup.querySelector('.read-more-btn');

    if (popupDescriptionContainer && readMoreBtn) {
        // Cek apakah teks melebihi 2 baris
        if (popupDescription.scrollHeight > popupDescription.clientHeight) {
            readMoreBtn.style.display = 'inline'; // Tampilkan tombol "Read More"
        }

        // Event listener untuk tombol "Read More"
        readMoreBtn.addEventListener('click', function () {
            popupDescriptionContainer.classList.toggle('expanded');
            popupDescription.style.webkitLineClamp = 'unset'; // Tampilkan semua teks
            readMoreBtn.textContent = popupDescriptionContainer.classList.contains('expanded') ? 'read less' : '...read more';
        });
    }

    // Variabel untuk menyimpan posisi awal touch
    let startX = 0;

    const handleTouchStart = (event) => {
        startX = event.touches[0].clientX;
    };

    const handleTouchEnd = (event) => {
        const endX = event.changedTouches[0].clientX;
        const distance = endX - startX;

        if (distance > 50) {
            showPrevImage();
        } else if (distance < -50) {
            showNextImage();
        }
    };

    // Pastikan hanya ada satu set listener untuk swipe
    popupImage.removeEventListener('touchstart', handleTouchStart);
    popupImage.removeEventListener('touchend', handleTouchEnd);
    popupImage.addEventListener('touchstart', handleTouchStart);
    popupImage.addEventListener('touchend', handleTouchEnd);

    // Tampilkan popup
    popup.style.display = 'flex';
}

// Fungsi untuk menutup popup
function closePopup() {
    const popup = document.getElementById('popup');
    popup.style.display = 'none';
}



// Fungsi untuk menampilkan gambar berikutnya
function showNextImage() {
    if (currentImageIndex < images.length - 1) {
        currentImageIndex++;
        updatePopupImage();

    }
}

// Fungsi untuk menampilkan gambar sebelumnya
function showPrevImage() {
    if (currentImageIndex > 0) {
        currentImageIndex--;
        updatePopupImage();
  
    }
}

// Fungsi untuk memperbarui gambar di popup
function updatePopupImage() {
    const popupImage = document.querySelector('.popup-image');
    if (popupImage && images[currentImageIndex]) {
        popupImage.src = images[currentImageIndex];
    }
}

// Fungsi untuk mengarahkan ke WhatsApp
function redirectToWhatsApp(productName) {
    const phoneNumber = "+6285961462361"; // Nomor WhatsApp (tanpa + atau 0)
    const message = `Saya ingin bertanya tentang produk ${productName} ini`; // Pesan otomatis
    const encodedMessage = encodeURIComponent(message); // Encode pesan untuk URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`; // Buat URL WhatsApp

    window.open(whatsappUrl, "_blank"); // Buka URL di tab baru
}

// Fungsi untuk mencari laptop
function searchLaptops() {
    const searchInput = document.getElementById('search-input').value.toLowerCase();
    const laptopCards = document.querySelectorAll('.laptop-cards .card');

    laptopCards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        const specs = card.querySelector('p').textContent.toLowerCase();

        // Cek apakah judul atau spesifikasi mengandung kata kunci pencarian
        if (title.includes(searchInput) || specs.includes(searchInput)) {
            card.style.display = 'flex'; // Tampilkan kartu yang sesuai
        } else {
            card.style.display = 'none'; // Sembunyikan kartu yang tidak sesuai
        }
    });
}

// Event listener untuk filter
function filterLaptops() {
    const filterBrand = document.getElementById('filter-brand');
    const filterHarga = document.getElementById('filter-harga');
    const laptopCards = document.querySelectorAll('.laptop-cards .card');

    const selectedBrand = filterBrand.value.toLowerCase(); // Ambil nilai brand yang dipilih
    const selectedHarga = filterHarga.value; // Ambil nilai harga yang dipilih

    laptopCards.forEach(card => {
        const merk = card.querySelector('h3').textContent.toLowerCase(); // Ambil merek dari judul
        const harga = card.querySelector('.price').textContent; // Ambil harga
        const hargaNumerik = parseInt(harga.replace(/\D/g, '')); // Konversi harga ke angka

        // Cek apakah merek dan harga sesuai dengan filter
        const isMerkMatch = selectedBrand === 'all' || merk.includes(selectedBrand);
        const isHargaMatch = selectedHarga === 'all' || hargaNumerik < parseInt(selectedHarga) * 1000000;

        // Tampilkan atau sembunyikan kartu berdasarkan filter
        if (isMerkMatch && isHargaMatch) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

// Fungsi untuk mengambil data banner dari backend
async function fetchBanners() {
    try {
        const response = await fetch('/api/banners'); // Ambil data dari endpoint /api/banners
        if (!response.ok) {
            throw new Error('Gagal mengambil data banner');
        }
        const banners = await response.json(); // Ubah respons ke JSON
        displayBanners(banners); // Tampilkan banner
    } catch (error) {
        console.error('Error:', error);
    }
}

// Fungsi untuk menampilkan banner di halaman
function displayBanners(banners) {
    const bannerSlide = document.getElementById('banner-slide');
    if (!bannerSlide) {
        console.error('Elemen banner-slide tidak ditemukan!');
        return;
    }

    bannerSlide.innerHTML = ''; // Kosongkan konten sebelumnya

    banners.forEach(banner => {
        const bannerElement = document.createElement('a');
        bannerElement.href = banner.link; // Tautan banner
        bannerElement.target = '_blank'; // Buka di tab baru
        bannerElement.innerHTML = `<img src="${banner.image}" alt="Banner">`; // Gambar banner
        bannerSlide.appendChild(bannerElement);
    });

    // Jalankan slider jika ada lebih dari satu banner
    if (banners.length > 1) {
        slideBanner(banners);
    }
}

// Fungsi untuk menggeser banner (slider)
function slideBanner(banners) {
    const bannerSlide = document.getElementById('banner-slide');
    const totalBanners = banners.length;
    let currentBannerIndex = 0;

    setInterval(() => {
        currentBannerIndex = (currentBannerIndex + 1) % totalBanners; // Geser ke banner berikutnya
        const offset = -currentBannerIndex * 100; // Hitung offset
        bannerSlide.style.transform = `translateX(${offset}%)`; // Geser banner
    }, 5000); // Ganti banner setiap 5 detik
}

// Jalankan fetchBanners saat halaman dimuat
window.onload = () => {
    fetchBanners();
};


let currentBannerIndex = 0;

// Modifikasi fungsi displayBanners
function displayBanners(banners) {
    const bannerSlide = document.getElementById('banner-slide');
    bannerSlide.innerHTML = ''; // Kosongkan konten sebelumnya

    banners.forEach(banner => {
        const bannerElement = document.createElement('a');
        bannerElement.href = banner.link;
        bannerElement.target = '_blank';
        bannerElement.innerHTML = `<img src="${banner.image}" alt="Banner">`;
        bannerSlide.appendChild(bannerElement);
    });

    slideBanner(banners); // Jalankan slider
}