const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

const sendBtn = document.getElementById("sendBtn");
const emailInput = document.getElementById("email");
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

if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
        const email = emailInput.value.trim();

        if (email === "") {
            showAlert("Silakan masukkan alamat email Anda!");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showAlert("Format email tidak valid!");
            return;
        }

        clearAlert();
        sendBtn.disabled = true;
        sendBtn.innerHTML = "<span>Mengirim link...</span>";

        try {
            const response = await fetch(`${API_ENDPOINT}/api/forgot-password`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            const result = await response.json();

            if (!response.ok) {
                showAlert(result.message || "Gagal memproses permintaan reset password.");
                return;
            }

            showAlert(result.message || "Email reset password telah dikirim!", "success");
            emailInput.value = "";

        } catch (error) {
            console.error("Forgot password error:", error);
            showAlert("Gagal menghubungi server. Pastikan backend sedang aktif.");
        } finally {
            sendBtn.disabled = false;
            sendBtn.innerHTML = "<span>Kirim Link Reset</span>";
        }
    });
}
