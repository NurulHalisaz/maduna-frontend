/**
 * UX Enhancements Script (Global)
 * Menyediakan fitur SweetAlert2 Toast, Loading Global, dan Interceptor Fetch.
 */

// 1. Inisialisasi SweetAlert2 Toast
const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: 3000,
    timerProgressBar: true,
    didOpen: (toast) => {
        toast.onmouseenter = Swal.stopTimer;
        toast.onmouseleave = Swal.resumeTimer;
    }
});

// Fungsi Global untuk memanggil Toast
window.showToast = function(message, icon = "success") {
    Toast.fire({
        icon: icon,
        title: message
    });
};

// 2. Override window.alert agar menggunakan SweetAlert2
window.originalAlert = window.alert;
window.alert = function(message) {
    let iconType = "info";
    if (message.toLowerCase().includes("gagal") || message.toLowerCase().includes("error") || message.toLowerCase().includes("ditolak")) {
        iconType = "error";
    } else if (message.toLowerCase().includes("berhasil") || message.toLowerCase().includes("sukses")) {
        iconType = "success";
    }

    if (iconType === "success") {
        showToast(message, "success");
    } else if (iconType === "error") {
        showToast(message, "error");
    } else {
        Swal.fire({
            icon: iconType,
            title: 'Informasi',
            text: message,
            confirmButtonColor: '#0F5C3A'
        });
    }
};

// 3. Global Fetch Interceptor untuk Loading Spinner
const originalFetch = window.fetch;
let activeRequests = 0;

// Buat elemen global loader
const globalLoader = document.createElement('div');
globalLoader.id = 'global-loader';
globalLoader.innerHTML = `
    <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
        <span class="visually-hidden">Loading...</span>
    </div>
`;
Object.assign(globalLoader.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: '9999',
    display: 'none',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)'
});
document.body.appendChild(globalLoader);

function showLoader() {
    activeRequests++;
    if (activeRequests > 0) {
        globalLoader.style.display = 'flex';
    }
}

function hideLoader() {
    activeRequests--;
    if (activeRequests <= 0) {
        activeRequests = 0;
        globalLoader.style.display = 'none';
    }
}

window.fetch = async function(...args) {
    showLoader();
    try {
        const response = await originalFetch.apply(this, args);
        // Otomatis menampilkan toast jika response method POST/PUT/DELETE sukses
        const method = (args[1] && args[1].method) ? args[1].method.toUpperCase() : 'GET';
        if (response.ok && ['POST', 'PUT', 'DELETE'].includes(method)) {
            // Toast khusus bisa ditambahkan di sini, tapi karena kita tak mau dobel dengan alert() lama, 
            // kita biarkan alert() lama yang di-override menjadi toast yang mengambil alih.
            // Pengecualian jika tidak ada alert sama sekali, kita bisa inject success message.
            if (method === 'DELETE') showToast("Data berhasil dihapus!", "success");
            if (method === 'POST') showToast("Data berhasil ditambahkan!", "success");
            if (method === 'PUT') showToast("Data berhasil diperbarui!", "success");
        }
        return response;
    } catch (error) {
        hideLoader();
        throw error;
    } finally {
        hideLoader();
    }
};

// 4. Global Sidebar & Overlay Logic (Mobile)

document.addEventListener("DOMContentLoaded", function() {

    // 5. Global Logout Logic
    const logoutBtn = document.getElementById("logoutBtn");
    if(logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            Swal.fire({
                title: 'Yakin ingin logout?',
                text: 'Anda akan keluar dari sesi admin.',
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
        });
    }
});
