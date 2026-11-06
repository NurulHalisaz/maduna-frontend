// ==========================================
// AUTH MIDDLEWARE FRONT-END
// ==========================================

(function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Ambil nama file html saat ini
    const pathParts = window.location.pathname.split("/");
    const page = pathParts[pathParts.length - 1] || "index.html";

    // Halaman yang boleh diakses bebas tanpa login
    const publicPages = [
        "login.html",
        "register.html",
        "index.html",
        "forgot_password.html",
        "reset_password.html"
    ];

    if (publicPages.includes(page)) {
        return;
    }

    // Belum login
    if (!token) {
        alert("Silakan login terlebih dahulu untuk mengakses halaman ini!");
        window.location.href = "login.html";
        return;
    }

    // Validasi token kadaluarsa secara client-side (JWT Base64 check)
    try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
            const decodedJson = JSON.parse(atob(payloadBase64));
            if (decodedJson.exp && decodedJson.exp * 1000 < Date.now()) {
                localStorage.clear();
                alert("Sesi login Anda telah berakhir. Silakan login kembali!");
                window.location.href = "login.html";
                return;
            }
        }
    } catch (e) {
        console.warn("Gagal membaca payload token:", e);
    }

    // Halaman admin diproteksi dari role customer
    if (page.includes("admin") && role !== "admin") {
        alert("Akses ditolak! Halaman ini khusus untuk administrator.");
        window.location.href = "dashboard_customer.html";
        return;
    }

    // Halaman customer diproteksi jika admin salah akses
    if (page.includes("customer") && role !== "customer") {
        // Opsional: jika admin membuka halaman customer, boleh dibiarkan atau diarahkan
        // Di sini kita biarkan admin tetap bisa melihat tampilan customer jika diinginkan
    }

})();
