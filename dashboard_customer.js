// ==========================================
// CEK LOGIN CUSTOMER & API SETUP
// ==========================================
const API_ENDPOINT = window.API_BASE || "https://maduna-backend.vercel.app";
const NAMA_PELANGGAN_AKTIF = localStorage.getItem("name") || "Pelanggan";
const USER_ID = localStorage.getItem("userId");

let cart = [];

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    const greeting = document.getElementById("userNameGreeting");
    if (greeting) {
        greeting.style.display = "inline";
        greeting.textContent = `Halo, ${NAMA_PELANGGAN_AKTIF} 👋`;
    }
    loadProducts();
});

// ==========================================
// LOGOUT
// ==========================================

function handleLogout() {
    Swal.fire({
        title: 'Yakin ingin logout?',
        text: 'Anda akan keluar dari akun pelanggan.',
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
}

// ==========================================
// LOAD PRODUK DARI DATABASE
// ==========================================

async function loadProducts() {
    const productContainer = document.getElementById("productContainer");
    if (!productContainer) return;

    productContainer.innerHTML = "<div class='loading-text' style='grid-column: 1 / -1; text-align: center; padding: 2rem;'>Memuat produk...</div>";

    try {
        // PERBAIKAN: Gunakan API_ENDPOINT
        const response = await fetch(`${API_ENDPOINT}/api/products`);
        if (!response.ok) {
            throw new Error(`Gagal memuat produk (${response.status})`);
        }

        const products = await response.json();
        productContainer.innerHTML = "";

        if (!Array.isArray(products) || products.length === 0) {
            productContainer.innerHTML = "<div class='empty-text' style='grid-column: 1 / -1; text-align: center; padding: 2rem; color: #666;'>Belum ada produk yang tersedia.</div>";
            return;
        }

        products.forEach(product => {
            const harga = Number(product.price || 0);
            const hargaRupiah = harga.toLocaleString("id-ID");

            const card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <div>
                    <div class="product-image-container">
                        <div class="product-badge">
                            Stok ${product.stock || 0}
                        </div>
                        <img
                            src="assets/${product.image || 'satu-botol.png'}"
                            alt="${escapeHTML(product.name)}"
                        >
                    </div>

                    <h3>${escapeHTML(product.name)}</h3>

                    <p class="product-desc">
                        ${escapeHTML(product.description || "Madu murni Gunung Latimojong.")}
                    </p>

                    <div class="product-price">
                        Rp ${hargaRupiah}
                    </div>
                </div>

                <button
                    class="btn-add-cart"
                    onclick="addToCart(
                        ${product.id},
                        '${escapeQuote(product.name)}',
                        ${harga}
                    )"
                >
                    Tambah ke Keranjang
                </button>
            `;

            productContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Gagal memuat produk:", error);
        productContainer.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: #dc3545;">
                <p style="margin-bottom: 0.75rem; font-weight: 500;">Gagal memuat katalog produk.</p>
                <button onclick="loadProducts()" style="padding: 6px 18px; border-radius: 20px; border: 1px solid #0F5C3A; background: transparent; color: #0F5C3A; cursor: pointer; font-weight: 500;">
                    Coba Lagi
                </button>
            </div>
        `;
    }
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

function escapeQuote(str) {
    if (!str) return "";
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// ==========================================
// KERANJANG
// ==========================================

function addToCart(id, nama, harga) {
    const item = cart.find(product => product.id === id);

    if (item) {
        item.qty++;
    } else {
        cart.push({
            id,
            nama,
            harga,
            qty: 1
        });
    }

    updateCartUI();
    // Menggunakan SweetAlert2 Toast untuk pop-up sukses menambahkan
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });
    Toast.fire({
        icon: 'success',
        title: `${nama} ditambahkan ke keranjang!`
    });
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    const cartCount = document.getElementById("cartCount");
    const cartItems = document.getElementById("cartItems");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    let totalHarga = 0;

    if (cartItems) {
        cartItems.innerHTML = "";

        if (cart.length === 0) {
            cartItems.innerHTML = "<p style='text-align: center; color: #888; padding: 2rem 0;'>Keranjang Anda kosong</p>";
        } else {
            cart.forEach(item => {
                const subtotal = item.harga * item.qty;
                totalHarga += subtotal;

                cartItems.innerHTML += `
                    <div class="cart-item">
                        <div class="cart-item-info">
                            <h4>
                                ${escapeHTML(item.nama)}
                                (x${item.qty})
                            </h4>
                            <p>
                                Rp ${subtotal.toLocaleString("id-ID")}
                            </p>
                        </div>
                        <button
                            class="btn-remove"
                            onclick="removeFromCart(${item.id})"
                        >
                            Hapus
                        </button>
                    </div>
                `;
            });
        }
    }

    if (cartCount) {
        cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    }

    if (cartTotalPrice) {
        cartTotalPrice.textContent = "Rp " + totalHarga.toLocaleString("id-ID");
    }
}

// ==========================================
// MODAL KERANJANG
// ==========================================

function toggleCart() {
    const modal = document.getElementById("cartModal");
    if (!modal) return;
    modal.style.display = modal.style.display === "flex" ? "none" : "flex";
}

// ==========================================
// CHECKOUT
// ==========================================

async function checkoutWA() {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesi Berakhir',
            text: 'Sesi login telah berakhir. Silakan login kembali.',
            confirmButtonColor: '#0F5C3A'
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    if (cart.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Keranjang Kosong',
            text: 'Silakan pilih produk terlebih dahulu sebelum checkout.',
            confirmButtonColor: '#0F5C3A'
        });
        return;
    }

    // Ambil data pelanggan (Nama & Email)
    const customerName = localStorage.getItem("name") || "Pelanggan";
    let customerEmail = localStorage.getItem("email");

    // Jika email belum tersimpan di localStorage, minta input sekali dari pelanggan
    if (!customerEmail || customerEmail === "-" || customerEmail === "undefined" || customerEmail.trim() === "") {
        const { value: inputEmail } = await Swal.fire({
            title: 'Konfirmasi Email',
            text: 'Mohon masukkan email Anda untuk kelengkapan data pesanan:',
            input: 'email',
            inputPlaceholder: 'email@contoh.com',
            confirmButtonColor: '#0F5C3A',
            confirmButtonText: 'Lanjutkan',
            showCancelButton: true,
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
                    return 'Silakan masukkan alamat email yang valid!';
                }
            }
        });

        if (!inputEmail) return; // Batal jika pengguna menutup prompt
        customerEmail = inputEmail.trim();
        localStorage.setItem("email", customerEmail);
    }

    try {
        let total = 0;
        cart.forEach(item => {
            total += Number(item.harga) * Number(item.qty);
        });

        const orderData = {
            user_id: USER_ID,
            quantity: cart.reduce((sum, item) => sum + item.qty, 0),
            total_price: total,
            items: cart.map(item => ({
                product_id: item.id,
                quantity: item.qty
            }))
        };

        // PERBAIKAN: Gunakan API_ENDPOINT
        const response = await fetch(`${API_ENDPOINT}/api/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });

        let data;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
            data = await response.json();
        } else {
            data = { message: "Gagal membuat pesanan" };
        }

        if (!response.ok) {
            throw new Error(data.message || "Gagal membuat pesanan.");
        }

        const nomorWA = "6285391832772";

        // Format pesan WhatsApp rapi: Nama, Email, Daftar Produk, dan Total
        let pesan = `Halo Admin Maduna, saya ingin melakukan pemesanan:\n\n`;
        pesan += `*DATA PEMESAN*\n`;
        pesan += `• Nama  : ${customerName}\n`;
        pesan += `• Email : ${customerEmail}\n\n`;

        pesan += `*DETAIL PESANAN*\n`;
        cart.forEach((item, index) => {
            const subtotal = Number(item.harga) * Number(item.qty);
            pesan += `${index + 1}. ${item.nama} (x${item.qty}) - Rp ${subtotal.toLocaleString("id-ID")}\n`;
        });

        pesan += `\n*TOTAL PEMBAYARAN*\n`;
        pesan += `Rp ${total.toLocaleString("id-ID")}\n\n`;
        pesan += `Mohon konfirmasi ketersediaan stok dan nomor rekening pembayarannya. Terima kasih!`;

        // Buka link WhatsApp dengan teks ter-encode rapi
        window.open(`https://wa.me/${nomorWA}?text=${encodeURIComponent(pesan)}`, "_blank");

        // Kosongkan keranjang
        cart = [];
        updateCartUI();
        toggleCart();

        Swal.fire({
            icon: 'success',
            title: 'Pesanan Berhasil Dibuat',
            text: 'Pesanan Anda telah disimpan dan diteruskan ke WhatsApp Admin.',
            confirmButtonColor: '#0F5C3A'
        });

    } catch (error) {
        console.error("Error checkout:", error);
        Swal.fire({
            icon: 'error',
            title: 'Checkout Gagal',
            text: error.message || 'Terjadi kesalahan saat memproses pesanan.',
            confirmButtonColor: '#0F5C3A'
        });
    }
}

// ==========================================
// RIWAYAT PESANAN
// ==========================================

function toggleHistory() {
    const modal = document.getElementById("historyModal");
    if (!modal) return;

    if (modal.style.display === "flex") {
        modal.style.display = "none";
    } else {
        renderHistory();
        modal.style.display = "flex";
    }
}

async function renderHistory() {
    const historyItems = document.getElementById("historyItems");
    const token = localStorage.getItem("token");
    
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesi Habis',
            text: 'Sesi login telah berakhir. Silakan login kembali.',
            confirmButtonColor: '#0F5C3A'
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    if (historyItems) {
        historyItems.innerHTML = "<tr><td colspan='4' style='text-align:center; padding: 1.5rem;'>Memuat riwayat...</td></tr>";
    }

    try {
        // PERBAIKAN: Gunakan API_ENDPOINT
        const response = await fetch(`${API_ENDPOINT}/api/orders/history/${USER_ID}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Gagal memuat data (${response.status})`);
        }

        const orders = await response.json();
        if (!historyItems) return;
        historyItems.innerHTML = "";

        if (!Array.isArray(orders) || orders.length === 0) {
            historyItems.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 2rem 0; color: #888;">
                        Belum ada riwayat pesanan.
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {
            const dateStr = order.order_date ? new Date(order.order_date).toLocaleDateString("id-ID") : "-";
            const priceStr = Number(order.total_price || 0).toLocaleString("id-ID");

            historyItems.innerHTML += `
                <tr>
                    <td>#${order.id}</td>
                    <td>${dateStr}</td>
                    <td>Rp ${priceStr}</td>
                    <td>
                        <span class="status-badge status-${order.status || 'pending'}">
                            ${order.status || 'pending'}
                        </span>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Gagal mengambil riwayat pesanan:", error);
        if (historyItems) {
            historyItems.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 1.5rem; color: #dc3545;">
                        Gagal memuat riwayat pesanan.
                        <button onclick="renderHistory()" style="margin-left: 8px; border: none; background: transparent; color: #0F5C3A; text-decoration: underline; cursor: pointer; font-weight: bold;">
                            Coba Lagi
                        </button>
                    </td>
                </tr>
            `;
        }
    }
}
