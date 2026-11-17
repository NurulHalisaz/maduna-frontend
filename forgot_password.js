const sendBtn = document.getElementById("sendBtn");
const emailInput = document.getElementById("email");

if (sendBtn) {
    sendBtn.addEventListener("click", async () => {
        const email = emailInput ? emailInput.value.trim() : "";

        if (!email) {
            Swal.fire({
                icon: 'warning',
                title: 'Email Kosong',
                text: 'Silakan masukkan alamat email akun Anda.',
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

        sendBtn.disabled = true;
        sendBtn.textContent = "Mengirim...";

        try {
            const response = await fetch("http://localhost:5000/api/forgot-password", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email })
            });

            let result;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                result = await response.json();
            } else {
                result = { message: "Gagal mengirim link reset password." };
            }

            if (!response.ok) {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mengirim',
                    text: result.message || 'Email tidak terdaftar atau server bermasalah.',
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }

            Swal.fire({
                icon: 'success',
                title: 'Email Terkirim',
                text: result.message || 'Tautan untuk mereset kata sandi telah dikirim ke email Anda.',
                confirmButtonColor: '#0F5C3A'
            });

            if (emailInput) emailInput.value = "";

        } catch (error) {
            console.error("Error forgot password:", error);
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Server tidak dapat dihubungi. Silakan coba beberapa saat lagi.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            sendBtn.disabled = false;
            sendBtn.textContent = "Kirim Link Reset";
        }
    });
}
