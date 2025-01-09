document.getElementById('loginForm').addEventListener('submit', function (e) {
    e.preventDefault(); // Mencegah form submit default

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Kirim data login ke backend
    fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Simpan token JWT di localStorage
            localStorage.setItem('token', data.token);

            // Redirect ke dashboard setelah login berhasil
            window.location.href = '/dashboard.html';
        } else {
            // Jika login gagal, tampilkan pesan error
            document.getElementById('errorMessage').textContent = data.message || 'Login gagal';
        }
    })
    .catch(error => {
        console.error('Error:', error);
        document.getElementById('errorMessage').textContent = 'Terjadi kesalahan saat login';
    });
});