/**
 * UX Enhancements Script (Global)
 * Menyediakan fitur SweetAlert2 Toast, Loading Global, Flash Message, dan Interceptor Fetch.
 */

// 1. Inisialisasi SweetAlert2 Toast Terpadu
const Toast = (typeof Swal !== "undefined") ? Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
}) : null;

// Fungsi Global untuk memanggil Toast
window.showToast = function(message, icon = "success") {
    if (Toast) {
        Toast.fire({
            icon: icon,
            title: message
        });
    } else {
        console.log(`[Toast ${icon}]: ${message}`);
    }
};

// Fungsi Global untuk memanggil Dialog Alert
window.showAlert = function(title, message, icon = "info") {
    if (typeof Swal !== "undefined") {
        return Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonColor: '#0F5C3A'
        });
    } else {
        alert(`${title}: ${message}`);
    }
};

// 2. Override window.alert bawaan agar otomatis menggunakan SweetAlert2
if (typeof Swal !== "undefined") {
    window.originalAlert = window.alert;
    window.alert = function(message) {
        if (!message) return;
        const msgStr = String(message);
        let iconType = "info";
        
        if (msgStr.toLowerCase().includes("gagal") || msgStr.toLowerCase().includes("error") || msgStr.toLowerCase().includes("ditolak") || msgStr.toLowerCase().includes("salah")) {
            iconType = "error";
        } else if (msgStr.toLowerCase().includes("berhasil") || msgStr.toLowerCase().includes("sukses")) {
            iconType = "success";
        } else if (msgStr.toLowerCase().includes("perhatian") || msgStr.toLowerCase().includes("silakan") || msgStr.toLowerCase().includes("masukkan") || msgStr.toLowerCase().includes("minimal")) {
            iconType = "warning";
        }

        if (iconType === "success") {
            showToast(msgStr, "success");
        } else {
            Swal.fire({
                icon: iconType,
                title: iconType === "error" ? 'Terjadi Kesalahan' : (iconType === 'warning' ? 'Perhatian' : 'Informasi'),
                text: msgStr,
                confirmButtonColor: '#0F5C3A'
            });
        }
    };
}

// 3. Global Fetch Interceptor untuk Loading Spinner & Auto-Handling 401
const originalFetch = window.fetch;
let activeRequests = 0;

// Buat elemen global loader jika document.body tersedia
let globalLoader = document.getElementById('global-loader');
if (!globalLoader) {
    globalLoader = document.createElement('div');
    globalLoader.id = 'global-loader';
    globalLoader.innerHTML = `
        <div class="spinner-border text-success" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;
    Object.assign(globalLoader.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(255, 255, 255, 0.65)',
        zIndex: '99999',
        display: 'none',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(2px)'
    });
    if (document.body) {
        document.body.appendChild(globalLoader);
    } else {
        document.addEventListener("DOMContentLoaded", () => document.body.appendChild(globalLoader));
    }
}

function showLoader() {
    activeRequests++;
    if (globalLoader && activeRequests > 0) {
        globalLoader.style.display = 'flex';
    }
}

function hideLoader() {
    activeRequests = Math.max(0, activeRequests - 1);
    if (globalLoader && activeRequests === 0) {
        globalLoader.style.display = 'none';
    }
}

window.fetch = async function(...args) {
    showLoader();
    try {
        const response = await originalFetch.apply(this, args);
        
        // Interceptor 401 Unauthorized: token kadaluarsa atau tidak valid
        if (response.status === 401) {
            const currentPath = window.location.pathname.toLowerCase();
            const isAuthPage = currentPath.includes("login.html") || currentPath.includes("register.html");
            if (!isAuthPage) {
                localStorage.clear();
                sessionStorage.setItem("flash_message", JSON.stringify({
                    type: "warning",
                    title: "Sesi Berakhir",
                    text: "Sesi login Anda telah berakhir. Silakan login kembali."
                }));
                window.location.href = "login.html";
            }
        }

        return response;
    } catch (error) {
        hideLoader();
        if (!navigator.onLine) {
            showToast("Koneksi internet terputus. Periksa jaringan Anda.", "error");
        }
        throw error;
    } finally {
        hideLoader();
    }
};

// 4. Periksa Flash Message & Logout Handler saat Halaman Selesai Dimuat
document.addEventListener("DOMContentLoaded", function() {
    // Tampilkan Flash Message jika ada
    try {
        const flashRaw = sessionStorage.getItem("flash_message");
        if (flashRaw) {
            sessionStorage.removeItem("flash_message");
            const flash = JSON.parse(flashRaw);
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    icon: flash.type || "info",
                    title: flash.title || "Informasi",
                    text: flash.text || "",
                    confirmButtonColor: '#0F5C3A'
                });
            }
        }
    } catch (e) {
        console.error("Gagal memproses flash message:", e);
    }

    // Auto-highlight active sidebar navigation item based on current page URL
    const currentPage = (window.location.pathname.split("/").pop() || "dashboard_admin.html").toLowerCase();
    const menuLinks = document.querySelectorAll(".sidebar .menu-link");
    if (menuLinks.length > 0) {
        menuLinks.forEach(link => {
            const href = (link.getAttribute("href") || "").toLowerCase();
            const parentLi = link.closest(".nav-item");
            if (href && (href === currentPage || (currentPage === "" && href === "dashboard_admin.html"))) {
                if (parentLi) parentLi.classList.add("active");
                link.classList.add("active");
            } else {
                if (parentLi) parentLi.classList.remove("active");
                link.classList.remove("active");
            }
        });
    }

    // Listener Logout Admin
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            if (typeof Swal !== "undefined") {
                Swal.fire({
                    title: 'Yakin ingin logout?',
                    text: 'Anda akan keluar dari sesi administrator.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DC3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Ya, Logout',
                    cancelButtonText: 'Batal'
                }).then((result) => {
                    if (result.isConfirmed) {
                        localStorage.clear();
                        window.location.href = "login.html";
                    }
                });
            } else {
                if (confirm("Yakin ingin logout?")) {
                    localStorage.clear();
                    window.location.href = "login.html";
                }
            }
        });
    }
});
