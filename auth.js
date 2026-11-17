// ==========================================
// AUTH MIDDLEWARE FRONT-END
// ==========================================

(function () {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    // Ambil nama file halaman saat ini
    const pathParts = window.location.pathname.split("/");
    const page = (pathParts.pop() || "index.html").toLowerCase();

    // Halaman yang boleh diakses publik tanpa login
    const publicPages = [
        "",
        "index.html",
        "login.html",
        "register.html",
        "forgot_password.html",
        "reset_password.html",
        "halaman12.html",
        "halaman3.html",
        "halaman4.html",
        "halaman5.html",
        "halaman6.html"
    ];

    if (publicPages.includes(page)) {
        // Jika sudah login dan membuka login.html, arahkan langsung ke dashboard sesuai role
        if (token && role && page === "login.html") {
            window.location.href = role === "admin" ? "dashboard_admin.html" : "dashboard_customer.html";
        }
        return;
    }

    // Belum login tapi mencoba mengakses halaman terproteksi
    if (!token) {
        sessionStorage.setItem("flash_message", JSON.stringify({
            type: "warning",
            title: "Akses Terbatas",
            text: "Silakan login terlebih dahulu untuk mengakses halaman ini."
        }));
        window.location.href = "login.html";
        return;
    }

    // Halaman admin tapi bukan admin
    if (page.includes("admin") && role !== "admin") {
        sessionStorage.setItem("flash_message", JSON.stringify({
            type: "error",
            title: "Akses Ditolak",
            text: "Halaman ini khusus untuk administrator."
        }));
        window.location.href = "dashboard_customer.html";
        return;
    }

    // Halaman customer tapi bukan customer (misal admin mencoba buka dashboard_customer)
    if (page.includes("customer") && role !== "customer") {
        sessionStorage.setItem("flash_message", JSON.stringify({
            type: "info",
            title: "Pengalihan",
            text: "Anda dialihkan ke dashboard administrator."
        }));
        window.location.href = "dashboard_admin.html";
    }
})();
