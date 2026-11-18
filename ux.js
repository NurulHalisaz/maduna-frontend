
/**
 * UX Enhancements Script (Global)
 * Toast, Loading Global, Flash Message, Fetch Interceptor,
 * dan penanganan sesi login.
 */

// ======================================================
// 1. SWEETALERT2 TOAST
// ======================================================

const Toast = (typeof Swal !== "undefined")
    ? Swal.mixin({
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
        }
    })
    : null;

window.showToast = function (message, icon = "success") {
    if (Toast) {
        Toast.fire({
            icon: icon,
            title: message
        });
    } else {
        console.log(`[Toast ${icon}]: ${message}`);
    }
};

// ======================================================
// 2. GLOBAL ALERT
// ======================================================

window.showAlert = function (title, message, icon = "info") {
    if (typeof Swal !== "undefined") {
        return Swal.fire({
            title: title,
            text: message,
            icon: icon,
            confirmButtonColor: "#0F5C3A"
        });
    } else {
        alert(`${title}: ${message}`);
    }
};

// Override alert bawaan
if (typeof Swal !== "undefined") {
    window.originalAlert = window.alert;

    window.alert = function (message) {
        if (!message) return;

        const msgStr = String(message);
        let iconType = "info";

        if (
            msgStr.toLowerCase().includes("gagal") ||
            msgStr.toLowerCase().includes("error") ||
            msgStr.toLowerCase().includes("ditolak") ||
            msgStr.toLowerCase().includes("salah")
        ) {
            iconType = "error";
        } else if (
            msgStr.toLowerCase().includes("berhasil") ||
            msgStr.toLowerCase().includes("sukses")
        ) {
            iconType = "success";
        } else if (
            msgStr.toLowerCase().includes("perhatian") ||
            msgStr.toLowerCase().includes("silakan") ||
            msgStr.toLowerCase().includes("masukkan") ||
            msgStr.toLowerCase().includes("minimal")
        ) {
            iconType = "warning";
        }

        if (iconType === "success") {
            showToast(msgStr, "success");
        } else {
            Swal.fire({
                icon: iconType,
                title:
                    iconType === "error"
                        ? "Terjadi Kesalahan"
                        : iconType === "warning"
                        ? "Perhatian"
                        : "Informasi",
                text: msgStr,
                confirmButtonColor: "#0F5C3A"
            });
        }
    };
}

// ======================================================
// 3. GLOBAL LOADER
// ======================================================

const originalFetch = window.fetch;
let activeRequests = 0;

let globalLoader = document.getElementById("global-loader");

if (!globalLoader) {
    globalLoader = document.createElement("div");
    globalLoader.id = "global-loader";

    globalLoader.innerHTML = `
        <div class="spinner-border text-success" role="status"
            style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Loading...</span>
        </div>
    `;

    Object.assign(globalLoader.style, {
        position: "fixed",
        top: "0",
        left: "0",
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(255, 255, 255, 0.65)",
        zIndex: "99999",
        display: "none",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)"
    });

    if (document.body) {
        document.body.appendChild(globalLoader);
    } else {
        document.addEventListener("DOMContentLoaded", () => {
            if (!document.getElementById("global-loader")) {
                document.body.appendChild(globalLoader);
            }
        });
    }
}

function showLoader() {
    activeRequests++;

    if (globalLoader && activeRequests > 0) {
        globalLoader.style.display = "flex";
    }
}

function hideLoader() {
    activeRequests = Math.max(0, activeRequests - 1);

    if (globalLoader && activeRequests === 0) {
        globalLoader.style.display = "none";
    }
}

// ======================================================
// 4. AUTHENTICATION HELPERS
// ======================================================

// Halaman yang tidak boleh dianggap sebagai halaman sesi aktif
function isAuthPage() {
    const path = window.location.pathname.toLowerCase();

    return (
        path.includes("login.html") ||
        path.includes("register.html") ||
        path.includes("forgot_password.html") ||
        path.includes("reset_password.html")
    );
}

// Endpoint autentikasi yang tidak boleh memicu sesi berakhir
function isAuthRequest(url) {
    const requestUrl = String(url).toLowerCase();

    return (
        requestUrl.includes("/api/login") ||
        requestUrl.includes("/api/register") ||
        requestUrl.includes("/api/forgot-password") ||
        requestUrl.includes("/api/reset-password")
    );
}

// Ambil token login
function getAuthToken() {
    return (
        localStorage.getItem("token") ||
        localStorage.getItem("accessToken") ||
        localStorage.getItem("authToken") ||
        localStorage.getItem("jwt")
    );
}

// Hanya menghapus data autentikasi, bukan seluruh localStorage
function clearAuthData() {
    const authKeys = [
        "token",
        "accessToken",
        "authToken",
        "jwt",
        "user",
        "currentUser",
        "loggedInUser"
    ];

    authKeys.forEach(key => {
        localStorage.removeItem(key);
    });

    sessionStorage.removeItem("token");
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("jwt");
}

// Mencegah popup sesi berakhir tampil berkali-kali
let sessionExpiredHandled = false;

// ======================================================
// 5. FETCH INTERCEPTOR
// ======================================================

window.fetch = async function (...args) {
    showLoader();

    try {
        const response = await originalFetch.apply(this, args);

        // Ambil URL request
        const requestUrl =
            typeof args[0] === "string"
                ? args[0]
                : args[0]?.url || "";

        // Penanganan hanya untuk HTTP 401
        if (response.status === 401) {

            // Jangan memproses 401 dari request login/register/reset password
            if (isAuthRequest(requestUrl)) {
                return response;
            }

            // Jangan memproses sesi berakhir ketika sedang di halaman autentikasi
            if (isAuthPage()) {
                return response;
            }

            // Jika tidak ada token, jangan menampilkan popup sesi berakhir berulang
            const token = getAuthToken();

            if (!token) {
                return response;
            }

            // Cegah popup dan redirect berulang
            if (!sessionExpiredHandled) {
                sessionExpiredHandled = true;

                clearAuthData();

                sessionStorage.setItem(
                    "flash_message",
                    JSON.stringify({
                        type: "warning",
                        title: "Sesi Berakhir",
                        text: "Sesi login Anda telah berakhir. Silakan login kembali."
                    })
                );

                window.location.replace("login.html");
            }
        }

        return response;

    } catch (error) {
        if (!navigator.onLine) {
            showToast(
                "Koneksi internet terputus. Periksa jaringan Anda.",
                "error"
            );
        }

        throw error;

    } finally {
        hideLoader();
    }
};

// ======================================================
// 6. DOM CONTENT LOADED
// ======================================================

document.addEventListener("DOMContentLoaded", function () {

    // ----------------------------------------------
    // FLASH MESSAGE
    // ----------------------------------------------

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
                    confirmButtonColor: "#0F5C3A"
                });
            }
        }
    } catch (e) {
        console.error("Gagal memproses flash message:", e);
    }

    // ----------------------------------------------
    // SIDEBAR ACTIVE MENU
    // ----------------------------------------------

    const currentPage = (
        window.location.pathname.split("/").pop() ||
        "dashboard_admin.html"
    ).toLowerCase();

    const menuLinks = document.querySelectorAll(
        ".sidebar .menu-link"
    );

    if (menuLinks.length > 0) {
        menuLinks.forEach(link => {
            const href = (
                link.getAttribute("href") || ""
            ).toLowerCase();

            const parentLi = link.closest(".nav-item");

            if (
                href &&
                (
                    href === currentPage ||
                    (
                        currentPage === "" &&
                        href === "dashboard_admin.html"
                    )
                )
            ) {
                if (parentLi) {
                    parentLi.classList.add("active");
                }

                link.classList.add("active");

            } else {
                if (parentLi) {
                    parentLi.classList.remove("active");
                }

                link.classList.remove("active");
            }
        });
    }

    // ----------------------------------------------
    // LOGOUT ADMIN
    // ----------------------------------------------

    const logoutBtn = document.getElementById("logoutBtn");

    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {

            if (typeof Swal !== "undefined") {
                Swal.fire({
                    title: "Yakin ingin logout?",
                    text: "Anda akan keluar dari sesi administrator.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#DC3545",
                    cancelButtonColor: "#6c757d",
                    confirmButtonText: "Ya, Logout",
                    cancelButtonText: "Batal"
                }).then((result) => {

                    if (result.isConfirmed) {
                        clearAuthData();
                        window.location.href = "login.html";
                    }
                });

            } else {
                if (confirm("Yakin ingin logout?")) {
                    clearAuthData();
                    window.location.href = "login.html";
                }
            }
        });
    }
});
