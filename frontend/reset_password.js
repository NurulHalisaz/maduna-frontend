const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

const token = new URLSearchParams(window.location.search).get("token");
const passwordInput = document.getElementById("password");
const confirmPasswordInput = document.getElementById("confirmPassword");
const resetBtn = document.getElementById("resetBtn");
const alertBox = document.getElementById("alertBox");

function showAlert(message, type = "error") {
    alertBox.textContent = message;
    alertBox.className = `alert-box alert-${type}`;
    alertBox.style.display = "block";
}

function clearAlert() {
    alertBox.textContent = "";
    alertBox.style.display = "none";
}

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
            icon.classList.add("bi-eye");
        }
    }
};

if (!token) {
    showAlert("Tautan reset password tidak valid atau tidak memiliki token!");
    if (resetBtn) resetBtn.disabled = true;
}

if (resetBtn) {
    resetBtn.addEventListener("click", async () => {
        const password = passwordInput.value;
        const confirmPassword = confirmPasswordInput.value;

        if (!token) {
            showAlert("Token reset password tidak ditemukan.");
            return;
        }

        if (password === "") {
            showAlert("Password baru wajib diisi!");
            return;
        }

        if (password.length < 8) {
            showAlert("Password minimal 8 karakter!");
            return;
        }

        if (password !== confirmPassword) {
            showAlert("Konfirmasi password tidak cocok!");
            return;
        }

        clearAlert();
        resetBtn.disabled = true;
        resetBtn.textContent = "Menyimpan password...";

        try {
            const response = await fetch(`${API_ENDPOINT}/api/reset-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    token,
                    password
                })
            });

            const result = await response.json();

            if (!response.ok) {
                showAlert(result.message || "Gagal mengubah password.");
                return;
            }

            showAlert(result.message || "Password berhasil diubah!", "success");

            setTimeout(() => {
                Swal.fire({
                    icon: 'success',
                    title: 'Password Berhasil Diubah!',
                    text: 'Silakan login menggunakan password baru Anda.',
                    confirmButtonColor: '#1F5533'
                }).then(() => {
                    window.location.href = "login.html";
                });
            }, 1000);

        } catch (error) {
            console.error("Reset password error:", error);
            showAlert("Gagal menghubungi server. Pastikan backend sedang aktif.");
        } finally {
            resetBtn.disabled = false;
            resetBtn.textContent = "Simpan Password Baru";
        }
    });
}
