// ==========================================
// API SETUP
// ==========================================
const API_ENDPOINT = window.API_BASE || "https://maduna-backend.vercel.app";

const token = new URLSearchParams(window.location.search).get("token");

// Periksa apakah token ada di URL saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
    if (!token) {
        Swal.fire({
            icon: 'error',
            title: 'Tautan Tidak Valid',
            text: 'Token reset password tidak ditemukan atau sudah kedaluwarsa. Silakan minta tautan baru.',
            confirmButtonColor: '#0F5C3A'
        }).then(() => {
            window.location.href = "forgot_password.html";
        });
    }
});

const resetBtn = document.getElementById("resetBtn");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");

if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        if (!password) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Silakan masukkan kata sandi baru Anda.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (password.length < 8) {
            Swal.fire({
                icon: 'warning',
                title: 'Kata Sandi Terlalu Pendek',
                text: 'Kata sandi minimal harus terdiri dari 8 karakter.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Konfirmasi Sandi Berbeda',
                text: 'Konfirmasi kata sandi tidak cocok.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        resetBtn.disabled = true;
        resetBtn.textContent = "Menyimpan...";

        try {
            // PERBAIKAN: Menggunakan API_ENDPOINT
            const response = await fetch(`${API_ENDPOINT}/api/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ token, password })
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                result = { message: "Gagal memproses reset password." };
            }

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Reset',
                    text: result.message || 'Token tidak valid atau sudah kedaluwarsa.',
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Kata Sandi Diperbarui',
                text: 'Kata sandi Anda berhasil diperbarui. Silakan login kembali.',
                confirmButtonColor: '#0F5C3A'
            }).then(() => {
                window.location.href = "login.html";
            });

        } catch (error) {
            console.error("Error reset password:", error);
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Server tidak dapat dihubungi. Silakan coba beberapa saat lagi.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = "Simpan Password";
        }
    });
}
