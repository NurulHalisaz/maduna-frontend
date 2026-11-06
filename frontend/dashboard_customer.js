// ==========================================
// CEK LOGIN CUSTOMER & KONFIGURASI
// ==========================================

const API_ENDPOINT = window.API_BASE || "http://localhost:5000";
const WHATSAPP_PHONE = window.WHATSAPP_NUMBER || "6285391832772";

function getCustomerProfile() {
    let name = localStorage.getItem("name") || "";
    let email = localStorage.getItem("email") || "";

    // Ambil dari payload token JWT jika ada
    const token = localStorage.getItem("token");
    if (token) {
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (!name && payload.name) {
                name = payload.name;
                localStorage.setItem("name", name);
            }
            if (!email && payload.email) {
                email = payload.email;
                localStorage.setItem("email", email);
            }
        } catch (e) {
            console.warn("Gagal mengekstrak profil dari token:", e);
        }
    }

    return {
        name: name || "Pelanggan Maduna",
        email: email || ""
    };
}

// Fungsi untuk menarik data profil asli (termasuk email) dari database
async function syncUserProfile() {
    const token = localStorage.getItem("token");
    if (!token) return null;

    try {
        const response = await fetch(`${API_ENDPOINT}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        if (response.ok) {
            const data = await response.json();
            if (data.email) {
                localStorage.setItem("email", data.email);
            }
            if (data.name) {
                localStorage.setItem("name", data.name);
            }
            return data;
        }
    } catch (e) {
        console.warn("Gagal mengambil profil dari server:", e);
    }
    return null;
}

const NAMA_PELANGGAN_AKTIF = getCustomerProfile().name;
const EMAIL_PELANGGAN_AKTIF = getCustomerProfile().email;
const USER_ID = localStorage.getItem("userId");

// Muat Keranjang Belanja dari LocalStorage agar tetap persisten meski halaman di-refresh
let cart = [];
try {
    const savedCart = localStorage.getItem("maduna_cart");
    if (savedCart) {
        cart = JSON.parse(savedCart);
    }
} catch (e) {
    console.warn("Gagal memuat cart dari localStorage:", e);
    cart = [];
}

// ==========================================
// INIT
// ==========================================

document.addEventListener("DOMContentLoaded", async () => {
    // Sinkronkan data email & nama asli dari database
    await syncUserProfile();

    const currentProfile = getCustomerProfile();
    const greeting = document.getElementById("userNameGreeting");
    if (greeting) {
        greeting.style.display = "inline";
        greeting.textContent = `Halo, ${currentProfile.name} 👋`;
    }

    // Perbarui UI keranjang dengan data yang tersimpan di localStorage
    updateCartUI();

    // Muat katalog produk
    loadProducts();
});

// ==========================================
// LOGOUT (Dengan Dialog SweetAlert2 Modern)
// ==========================================

function handleLogout() {
    Swal.fire({
        title: 'Yakin ingin keluar?',
        text: 'Anda akan mengakhiri sesi belanja ini.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#1F5533',
        cancelButtonColor: '#934C03',
        confirmButtonText: 'Ya, Keluar',
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

    try {
        const response = await fetch(`${API_ENDPOINT}/api/products`);
        if (!response.ok) {
            throw new Error("Gagal mengambil data produk dari server");
        }

        const products = await response.json();
        productContainer.innerHTML = "";

        if (products.length === 0) {
            productContainer.innerHTML = `
                <div class="empty-products" style="grid-column: 1/-1; text-align: center; padding: 50px 20px; color: #777;">
                    <i class="bi bi-box-seam" style="font-size: 40px; color: #2B5E39;"></i>
                    <p style="margin-top: 15px; font-weight: 500;">Saat ini belum ada produk madu yang tersedia.</p>
                </div>
            `;
            return;
        }

        products.forEach(product => {
            const harga = Number(product.price);
            const hargaRupiah = harga.toLocaleString("id-ID");
            
            // Deskripsi dinamis dari database dengan fallback jika kosong
            const deskripsi = (product.description && product.description.trim() !== "")
                ? product.description
                : "Madu murni alami lebah liar pegunungan Latimojong.";

            // Gambar dinamis dengan fallback jika nama file gambar tidak ada
            const gambar = product.image ? `assets/${product.image}` : "assets/satu-botol.png";

            const card = document.createElement("div");
            card.className = "product-card";

            card.innerHTML = `
                <div>
                    <div class="product-image-container">
                        <div class="product-badge">
                            ${product.stock > 0 ? `Stok ${product.stock}` : 'Habis'}
                        </div>
                        <img
                            src="${gambar}"
                            onerror="this.onerror=null; this.src='assets/satu-botol.png';"
                            alt="${product.name}"
                            loading="lazy"
                        >
                    </div>

                    <h3>${product.name}</h3>

                    <div class="product-meta">
                        ${product.volume ? `<span class="weight"><i class="bi bi-droplet-fill"></i> ${product.volume}</span>` : ''}
                        ${product.category ? `<span>${product.category}</span>` : ''}
                    </div>

                    <p class="product-desc" title="${deskripsi}">
                        ${deskripsi}
                    </p>

                    <div class="product-price">
                        Rp ${hargaRupiah}
                    </div>
                </div>

                <button
                    class="btn-add-cart"
                    ${product.stock <= 0 ? 'disabled' : ''}
                    onclick="addToCart(
                        ${product.id},
                        '${product.name.replace(/'/g, "\\'")}',
                        ${harga},
                        ${product.stock}
                    )"
                >
                    ${product.stock > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                </button>
            `;

            productContainer.appendChild(card);
        });

    } catch (error) {
        console.error("Error loading products:", error);
        productContainer.innerHTML = `
            <div class="loading-text" style="color: #dc3545;">
                <i class="bi bi-exclamation-triangle" style="font-size: 28px;"></i>
                <p>Gagal memuat produk. Pastikan server backend sedang aktif.</p>
            </div>
        `;
    }
}

// ==========================================
// KERANJANG BELANJA PERSISTEN
// ==========================================

function addToCart(id, nama, harga, maxStock) {
    const item = cart.find(product => product.id === id);

    if (item) {
        if (maxStock && item.qty >= maxStock) {
            Swal.fire({
                icon: 'warning',
                title: 'Batas Stok Tercapai',
                text: `Maaf, stok ${nama} hanya tersedia ${maxStock} botol.`,
                confirmButtonColor: '#1F5533'
            });
            return;
        }
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

    if (window.showToast) {
        window.showToast(`${nama} ditambahkan ke keranjang!`, "success");
    }
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateCartUI() {
    // Simpan ke localStorage agar tidak hilang saat refresh
    try {
        localStorage.setItem("maduna_cart", JSON.stringify(cart));
    } catch(e) {
        console.warn("Gagal menyimpan ke localStorage:", e);
    }

    const cartCount = document.getElementById("cartCount");
    const cartItems = document.getElementById("cartItems");
    const cartTotalPrice = document.getElementById("cartTotalPrice");

    if (!cartCount || !cartItems || !cartTotalPrice) return;

    let totalHarga = 0;
    cartItems.innerHTML = "";

    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div style="text-align: center; padding: 30px; color: #888;">
                <i class="bi bi-cart-x" style="font-size: 36px; color: #D7C6AA;"></i>
                <p style="margin-top: 10px;">Keranjang belanja Anda masih kosong.</p>
            </div>
        `;
    } else {
        cart.forEach(item => {
            const subtotal = item.harga * item.qty;
            totalHarga += subtotal;

            cartItems.innerHTML += `
                <div class="cart-item">
                    <div class="cart-item-info">
                        <h4>${item.nama} (x${item.qty})</h4>
                        <p>Rp ${subtotal.toLocaleString("id-ID")}</p>
                    </div>
                    <button class="btn-remove" onclick="removeFromCart(${item.id})" title="Hapus item">
                        <i class="bi bi-trash"></i> Hapus
                    </button>
                </div>
            `;
        });
    }

    cartCount.textContent = cart.reduce((sum, item) => sum + item.qty, 0);
    cartTotalPrice.textContent = "Rp " + totalHarga.toLocaleString("id-ID");
}

// ==========================================
// MODAL KERANJANG
// ==========================================

function toggleCart() {
    const modal = document.getElementById("cartModal");
    if (!modal) return;
    modal.style.display = (modal.style.display === "flex") ? "none" : "flex";
}

// Tutup modal jika user klik di luar konten
window.addEventListener("click", (e) => {
    const cartModal = document.getElementById("cartModal");
    const historyModal = document.getElementById("historyModal");
    if (e.target === cartModal) cartModal.style.display = "none";
    if (e.target === historyModal) historyModal.style.display = "none";
});

// ==========================================
// CHECKOUT VIA WHATSAPP & SIMPAN KE DATABASE
// ==========================================

async function checkoutWA() {
    const token = localStorage.getItem("token");

    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Sesi Berakhir',
            text: 'Silakan login terlebih dahulu untuk melakukan pemesanan.',
            confirmButtonColor: '#1F5533'
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    if (cart.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Keranjang Kosong',
            text: 'Pilih produk terlebih dahulu sebelum melakukan checkout!',
            confirmButtonColor: '#1F5533'
        });
        return;
    }

    try {
        let total = 0;
        let totalQty = 0;
        cart.forEach(item => {
            total += item.harga * item.qty;
            totalQty += item.qty;
        });

        // Ambil data profil terbaru dari server jika email belum ada
        if (!localStorage.getItem("email")) {
            await syncUserProfile();
        }
        const profile = getCustomerProfile();

        // Jika email masih belum tersimpan (sesi lama tanpa email), minta sekali dan simpan permanen
        if (!profile.email) {
            const { value: inputEmail } = await Swal.fire({
                title: 'Konfirmasi Email',
                text: 'Masukkan alamat email Anda untuk rincian pemesanan:',
                input: 'email',
                inputPlaceholder: 'contoh: nama@gmail.com',
                confirmButtonColor: '#1F5533',
                confirmButtonText: 'Lanjutkan Pesanan',
                allowOutsideClick: false,
                inputValidator: (value) => {
                    if (!value) {
                        return 'Alamat email wajib diisi!';
                    }
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value.trim())) {
                        return 'Format email tidak valid (contoh: nama@gmail.com)!';
                    }
                }
            });

            if (inputEmail) {
                profile.email = inputEmail.trim();
                localStorage.setItem("email", profile.email);
            } else {
                return; // Batalkan jika user tidak mengisi
            }
        }

        const todayStr = new Date().toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

        // Default ID Order jika server backend belum menyala
        let orderIdDisplay = `#MDN-${Date.now().toString().slice(-4)}`;

        try {
            const orderData = {
                quantity: totalQty,
                total_price: total,
                items: cart.map(item => ({
                    product_id: item.id,
                    quantity: item.qty
                }))
            };

            const response = await fetch(`${API_ENDPOINT}/api/orders`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (response.ok) {
                const result = await response.json();
                if (result.orderId) {
                    orderIdDisplay = `#${result.orderId}`;
                }
            }
        } catch (dbErr) {
            console.warn("Gagal simpan ke DB lokal, tetap lanjut membuat pesan WA:", dbErr);
        }

        // Susun Format Pesan WhatsApp Sesuai Permintaan
        let pesan = `Halo Admin Maduna 🍯,\n`;
        pesan += `Saya ingin memesan Madu Hutan Asli Latimojong melalui website:\n\n`;
        pesan += `━━━━━━━━━━━━━━━━━━━━━\n`;
        pesan += `📦 DETAIL PESANAN\n`;
        pesan += `• ID Order : ${orderIdDisplay}\n`;
        pesan += `• Tanggal     : ${todayStr}\n`;
        pesan += `• Produk      :\n`;
        cart.forEach(item => {
            pesan += `  - ${item.nama} x ${item.qty} [Rp ${(item.harga * item.qty).toLocaleString("id-ID")}]\n`;
        });
        pesan += `• Subtotal    : Rp ${total.toLocaleString("id-ID")}\n`;
        pesan += `━━━━━━━━━━━━━━━━━━━━━\n`;
        pesan += `📍 DATA PENERIMA\n`;
        pesan += `• Nama Penerima : ${profile.name}\n`;
        pesan += `• email : ${profile.email}`;

        // ENCODE SELURUH PESAN DENGAN encodeURIComponent
        // Ini memastikan karakter '#', emoji, baris baru '\n', spasi, dll tidak terpotong!
        const encodedPesan = encodeURIComponent(pesan);

        // Buka chat WhatsApp di tab baru
        window.open(`https://wa.me/${WHATSAPP_PHONE}?text=${encodedPesan}`, "_blank");

        // Kosongkan keranjang
        cart = [];
        updateCartUI();
        toggleCart();

        Swal.fire({
            icon: 'success',
            title: 'Pesanan Siap Dikirim!',
            text: 'Format pemesanan lengkap telah dibuat dan dibuka di WhatsApp Admin.',
            confirmButtonColor: '#1F5533'
        });

        // Muat ulang stok produk
        loadProducts();

    } catch (error) {
        console.error("Checkout error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Gagal Checkout',
            text: error.message || 'Terjadi kesalahan saat memproses pesanan. Coba beberapa saat lagi.',
            confirmButtonColor: '#1F5533'
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
            confirmButtonColor: '#1F5533'
        }).then(() => {
            window.location.href = "login.html";
        });
        return;
    }

    historyItems.innerHTML = `
        <tr>
            <td colspan="4" style="text-align: center; padding: 25px; color: #777;">
                <i class="bi bi-hourglass-split"></i> Memuat riwayat pesanan...
            </td>
        </tr>
    `;

    try {
        const response = await fetch(`${API_ENDPOINT}/api/orders/history/${USER_ID}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error("Gagal mengambil data riwayat pesanan");
        }

        const orders = await response.json();
        historyItems.innerHTML = "";

        if (orders.length === 0) {
            historyItems.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 30px; color: #888;">
                        <i class="bi bi-bag-x" style="font-size: 28px; color: #D7C6AA;"></i>
                        <p style="margin-top: 8px;">Belum ada riwayat pesanan.</p>
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {
            const tanggal = order.order_date
                ? new Date(order.order_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })
                : "-";

            historyItems.innerHTML += `
                <tr>
                    <td><strong>#${order.id}</strong></td>
                    <td>${tanggal}</td>
                    <td style="font-weight: 600; color: #1F5533;">Rp ${Number(order.total_price).toLocaleString("id-ID")}</td>
                    <td>
                        <span class="status-badge status-${order.status}">
                            ${order.status}
                        </span>
                    </td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Error fetching order history:", error);
        historyItems.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 20px; color: #dc3545;">
                    <i class="bi bi-exclamation-circle"></i> Gagal memuat data riwayat pesanan.
                </td>
            </tr>
        `;
    }
}
