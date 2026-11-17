// =========================
// SLIDER LOGIN & SIGNUP
// =========================

const loginText = document.querySelector(".title-text .login");
const loginFormSlider = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector(".signup-link a");

if (signupBtn && loginFormSlider && loginText) {
    signupBtn.onclick = () => {
        loginFormSlider.style.marginLeft = "-50%";
        loginText.style.marginLeft = "-50%";
    };
}

if (loginBtn && loginFormSlider && loginText) {
    loginBtn.onclick = () => {
        loginFormSlider.style.marginLeft = "0%";
        loginText.style.marginLeft = "0%";
    };
}

if (signupLink && signupBtn) {
    signupLink.onclick = () => {
        signupBtn.click();
        return false;
    };
}

// =========================
// LOGIN
// =========================

const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const emailInput = document.getElementById("loginEmail");
        const passwordInput = document.getElementById("loginPassword");
        const submitBtn = loginForm.querySelector("input[type='submit']");

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";

        if (!email || !password) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Silakan isi email dan password Anda.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        // Indikator loading pada tombol
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.value = "Memproses...";
        }

        try {
            const response = await fetch("http://localhost:5000/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            // Parsing respons aman (JSON vs HTML)
            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: "Respons server tidak sesuai format yang diharapkan." };
            }

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Login Gagal',
                    text: data.message || "Email atau kata sandi tidak cocok.",
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }

            // Simpan data otentikasi
            localStorage.setItem("token", data.token);
            localStorage.setItem("role", data.user.role);
            localStorage.setItem("userId", data.user.id);
            localStorage.setItem("name", data.user.name);
            if (data.user.email) {
                localStorage.setItem("email", data.user.email);
            }

            // Redirect sesuai role
            if (data.user.role === "admin") {
                window.location.href = "dashboard_admin.html";
            } else {
                window.location.href = "dashboard_customer.html";
            }

        } catch (error) {
            console.error("Error saat login:", error);
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Server tidak dapat dihubungi. Pastikan server backend sedang berjalan.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.value = "Masuk";
            }
        }
    });
}

// =========================
// REGISTER
// =========================

const signupForm = document.getElementById("signupForm");
if (signupForm) {
    signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const nameInput = document.getElementById("registerName");
        const emailInput = document.getElementById("registerEmail");
        const passwordInput = document.getElementById("registerPassword");
        const confirmPasswordInput = document.getElementById("registerConfirmPassword");
        const submitBtn = signupForm.querySelector("input[type='submit']");

        const name = nameInput ? nameInput.value.trim() : "";
        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value : "";
        const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : "";

        // Validasi input
        if (!name || !email || !password || !confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Semua kolom pendaftaran wajib diisi.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Format Email Salah',
                text: 'Silakan masukkan alamat email yang valid.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (password.length < 8) {
            Swal.fire({
                icon: 'warning',
                title: 'Password Terlalu Pendek',
                text: 'Kata sandi minimal harus terdiri dari 8 karakter.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (password !== confirmPassword) {
            Swal.fire({
                icon: 'warning',
                title: 'Konfirmasi Password Berbeda',
                text: 'Konfirmasi kata sandi tidak cocok dengan kata sandi.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        // Indikator loading
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.value = "Mendaftarkan...";
        }

        try {
            const response = await fetch("http://localhost:5000/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ name, email, password })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: "Terjadi kesalahan respons server." };
            }

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Pendaftaran Gagal',
                    text: data.message || 'Gagal melakukan pendaftaran akun.',
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Pendaftaran Berhasil',
                text: 'Akun Anda berhasil dibuat. Silakan login menggunakan akun baru.',
                confirmButtonColor: '#0F5C3A'
            });

            if (loginBtn) loginBtn.click();
            signupForm.reset();

        } catch (error) {
            console.error("Error saat registrasi:", error);
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Server tidak dapat dihubungi. Silakan coba beberapa saat lagi.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.value = "Daftar";
            }
        }
    });
}
