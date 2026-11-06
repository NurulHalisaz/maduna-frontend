// =========================
// SLIDER LOGIN & SIGNUP
// =========================

const loginText = document.querySelector(".title-text .login");
const loginFormSlider = document.querySelector("form.login");
const loginBtn = document.querySelector("label.login");
const signupBtn = document.querySelector("label.signup");
const signupLink = document.querySelector(".signup-link a");

signupBtn.onclick = () => {
    loginFormSlider.style.marginLeft = "-50%";
    loginText.style.marginLeft = "-50%";
    const signupRadio = document.getElementById("signup");
    if (signupRadio) signupRadio.checked = true;
};

loginBtn.onclick = () => {
    loginFormSlider.style.marginLeft = "0%";
    loginText.style.marginLeft = "0%";
    const loginRadio = document.getElementById("login");
    if (loginRadio) loginRadio.checked = true;
};

if (signupLink) {
    signupLink.onclick = (e) => {
        e.preventDefault();
        signupBtn.click();
        return false;
    };
}

// =========================
// TOGGLE PASSWORD VISIBILITY
// =========================

window.togglePasswordVisibility = function(inputId, button) {
    const input = document.getElementById(inputId);
    if (!input) return;

    const icon = button.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        if (icon) {
            icon.classList.remove("bi-eye");
            icon.classList.add("bi-eye-slash");
        }
    } else {
        input.type = "password";
        if (icon) {
            icon.classList.remove("bi-eye-slash");
            icon.classList.add("bi-eye-eye");
            icon.classList.replace("bi-eye-eye", "bi-eye");
        }
    }
};

// =========================
// HELPER PESAN ERROR / SUKSES
// =========================

function showLoginError(msg) {
    const el = document.getElementById("loginError");
    if (el) { el.textContent = msg; el.style.display = "block"; }
}
function clearLoginError() {
    const el = document.getElementById("loginError");
    if (el) { el.textContent = ""; el.style.display = "none"; }
}
function showRegisterError(msg) {
    const el = document.getElementById("registerError");
    if (el) { el.textContent = msg; el.style.display = "block"; }
}
function clearRegisterError() {
    const el = document.getElementById("registerError");
    if (el) { el.textContent = ""; el.style.display = "none"; }
}
function showRegisterSuccess(msg) {
    const el = document.getElementById("registerError");
    if (el) {
        el.textContent = msg;
        el.style.color = "#1F5533";
        el.style.background = "#e8f5ec";
        el.style.borderColor = "#1F5533";
        el.style.display = "block";
    }
}

// =========================
// KONFIGURASI API
// =========================

const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

// =========================
// LOGIN
// =========================

document
.getElementById("loginForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const email =
        document.getElementById("loginEmail").value.trim();

    const password =
        document.getElementById("loginPassword").value;

    // --- Validasi Input ---
    if (!email || !password) {
        showLoginError("Email dan password tidak boleh kosong!");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showLoginError("Format email tidak valid!");
        return;
    }

    if (password.length < 8) {
        showLoginError("Password minimal 8 karakter!");
        return;
    }

    // --- Loading State ---
    const submitBtn = document.querySelector("#loginForm input[type='submit']");
    submitBtn.disabled = true;
    submitBtn.value = "Memproses...";
    clearLoginError();

    try {

        const response = await fetch(
            `${API_ENDPOINT}/api/login`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showLoginError(data.message || "Gagal masuk. Periksa kembali email dan password.");
            return;
        }

        localStorage.setItem("token", data.token);
        localStorage.setItem("role",  data.user.role);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("name",  data.user.name);
        localStorage.setItem("email", data.user.email || "");

        // Redirect sesuai role
        if (data.user.role === "admin") {
            window.location.href = "dashboard_admin.html";
        } else {
            window.location.href = "dashboard_customer.html";
        }

    } catch (error) {

        console.error(error);
        showLoginError("Server tidak dapat dihubungi. Pastikan server backend sedang aktif.");

    } finally {

        submitBtn.disabled = false;
        submitBtn.value = "Login";

    }

});

// =========================
// REGISTER
// =========================

document
.getElementById("signupForm")
.addEventListener("submit", async (e) => {

    e.preventDefault();

    const name =
        document.getElementById("registerName").value.trim();

    const email =
        document.getElementById("registerEmail").value.trim();

    const password =
        document.getElementById("registerPassword").value;

    const confirmPassword =
        document.getElementById(
            "registerConfirmPassword"
        ).value;

    // --- Validasi Input ---
    if (!name || !email || !password || !confirmPassword) {
        showRegisterError("Semua kolom wajib diisi!");
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        showRegisterError("Format email tidak valid!");
        return;
    }

    if(password.length < 8){
        showRegisterError("Password minimal 8 karakter");
        return;
    }

    if(password !== confirmPassword){
        showRegisterError("Konfirmasi password tidak cocok");
        return;
    }

    // --- Loading State ---
    const submitBtn = document.querySelector("#signupForm input[type='submit']");
    submitBtn.disabled = true;
    submitBtn.value = "Mendaftar...";
    clearRegisterError();

    try {

        const response = await fetch(
            `${API_ENDPOINT}/api/register`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            }
        );

        const data = await response.json();

        if(!response.ok){
            showRegisterError(data.message || "Gagal melakukan pendaftaran akun.");
            return;
        }

        showRegisterSuccess("Registrasi berhasil! Silakan geser ke tab Login untuk masuk.");

        setTimeout(() => {
            loginBtn.click();
            document.getElementById("signupForm").reset();
            clearRegisterError();
        }, 1500);

    } catch(error){

        console.error(error);
        showRegisterError("Server tidak dapat dihubungi. Pastikan server backend sedang aktif.");

    } finally {

        submitBtn.disabled = false;
        submitBtn.value = "Daftar";

    }

});
