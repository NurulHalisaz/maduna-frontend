const token = localStorage.getItem("token");

let allProducts = [];

// ======================
// LOAD PRODUK
// ======================

async function loadProducts() {
    const table = document.getElementById("productsTable");
    const totalEl = document.getElementById("totalProducts");

    try {
        const response = await fetch("http://localhost:5000/api/products");
        if (!response.ok) {
            throw new Error(`Gagal memuat produk (${response.status})`);
        }

        allProducts = await response.json();
        if (!Array.isArray(allProducts)) {
            allProducts = [];
        }
        
        if (totalEl) totalEl.textContent = allProducts.length;
        applyProductFilters();
    } catch (error) {
        console.error("Gagal mengambil data produk:", error);
        if (totalEl) totalEl.textContent = "-";
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center py-5">
                        <div class="empty-state text-danger">
                            <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                            <p class="mb-2 fw-medium">Gagal mengambil data produk.</p>
                            <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="loadProducts()">
                                <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function renderProducts(products) {
    const table = document.getElementById("productsTable");
    if (!table) return;
    table.innerHTML = "";

    if (products.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="empty-state text-muted opacity-75">
                        <i class="bi bi-mailbox fs-1 mb-2 d-block"></i>
                        <p class="mb-0 fw-medium">Tidak ditemukan data yang sesuai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(product => {
        table.innerHTML += `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="assets/${product.image || 'satu-botol.png'}" class="product-img shadow-sm rounded-3" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td class="fw-medium text-dark">${product.name}</td>
            <td>${product.volume || '-'}</td>
            <td class="fw-semibold text-primary">Rp ${Number(product.price || 0).toLocaleString("id-ID")}</td>
            <td>${product.stock || 0}</td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button
                    class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium d-flex align-items-center"
                    onclick="openEditModal(${product.id}, '${escapeQuote(product.name)}', '${escapeQuote(product.category)}', '${escapeQuote(product.volume)}', \`${escapeQuote(product.description || "")}\`, '${escapeQuote(product.image || "")}', ${product.price || 0}, ${product.stock || 0})">
                        <i class="bi bi-pencil-square me-1"></i>Edit
                    </button>
                    <button
                    class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-medium d-flex align-items-center"
                    onclick="deleteProduct(${product.id})">
                        <i class="bi bi-trash me-1"></i>Hapus
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
}

function escapeQuote(str) {
    if (!str) return "";
    return String(str).replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

// REALTIME SEARCH & FILTER
const searchProductInput = document.getElementById('searchInput');
const productPaginationInfo = document.getElementById('paginationInfo');

function applyProductFilters() {
    const keyword = (searchProductInput?.value || "").toLowerCase().trim();
    const filtered = allProducts.filter(p => 
        (p.name || "").toLowerCase().includes(keyword) ||
        (p.category || "").toLowerCase().includes(keyword)
    );
    renderProducts(filtered);
    updateProductPaginationInfo(filtered.length, allProducts.length);
}

function updateProductPaginationInfo(filteredCount, totalCount) {
    if (!productPaginationInfo) return;
    if (totalCount === 0) {
        productPaginationInfo.textContent = "Belum ada produk";
    } else if (filteredCount === totalCount) {
        productPaginationInfo.textContent = `Menampilkan seluruh ${totalCount} produk`;
    } else {
        productPaginationInfo.textContent = `Menampilkan ${filteredCount} dari ${totalCount} produk`;
    }
}

searchProductInput?.addEventListener('input', applyProductFilters);

// ======================
// MODAL EDIT
// ======================

function openEditModal(id, name, category, volume, description, image, price, stock) {
    const modal = document.getElementById("editModal");
    if (modal) modal.style.display = "flex";

    document.getElementById("editId").value = id || "";
    document.getElementById("editName").value = name || "";
    document.getElementById("editCategory").value = category || "";
    document.getElementById("editVolume").value = volume || "";
    document.getElementById("editDescription").value = description || "";
    document.getElementById("editImage").value = image || "";
    document.getElementById("editPrice").value = price || "";
    document.getElementById("editStock").value = stock || "";
}

// ======================
// TOMBOL TAMBAH PRODUK
// ======================

window.openAddModal = function() {
    const editModal = document.getElementById("editModal");
    if (editModal) editModal.style.display = "flex";

    document.getElementById("editId").value = "";
    document.getElementById("editName").value = "";
    document.getElementById("editCategory").value = "";
    document.getElementById("editVolume").value = "";
    document.getElementById("editDescription").value = "";
    document.getElementById("editImage").value = "";
    document.getElementById("editPrice").value = "";
    document.getElementById("editStock").value = "";
};

// ======================
// CHOOSE FILE
// ======================

const imageFile = document.getElementById("editImageFile");
if (imageFile) {
    imageFile.addEventListener("change", function() {
        if (this.files && this.files.length > 0) {
            const file = this.files[0];
            const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
            if (!allowedTypes.includes(file.type)) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Format Tidak Sesuai',
                    text: 'Silakan pilih berkas gambar bertipe JPG, PNG, atau WEBP.',
                    confirmButtonColor: '#0F5C3A'
                });
                this.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Ukuran Terlalu Besar',
                    text: 'Ukuran berkas gambar maksimal 5MB.',
                    confirmButtonColor: '#0F5C3A'
                });
                this.value = '';
                return;
            }

            document.getElementById("editImage").value = file.name;
        }
    });
}

// ======================
// SIMPAN
// ======================

const saveBtn = document.getElementById("saveBtn");
if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
        const id = document.getElementById("editId").value;
        const name = document.getElementById("editName").value.trim();
        const category = document.getElementById("editCategory").value.trim();
        const volume = document.getElementById("editVolume").value.trim();
        const description = document.getElementById("editDescription").value.trim();
        const image = document.getElementById("editImage").value.trim();
        const price = document.getElementById("editPrice").value.trim();
        const stock = document.getElementById("editStock").value.trim();

        // Validasi Form
        if (!name) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Nama produk wajib diisi.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (!price || isNaN(price) || Number(price) < 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Harga Tidak Valid',
                text: 'Silakan masukkan nominal harga yang valid.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        if (!stock || isNaN(stock) || Number(stock) < 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Stok Tidak Valid',
                text: 'Silakan masukkan jumlah stok yang valid.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        const isNewProduct = id === "";
        const url = isNewProduct ? "http://localhost:5000/api/products" : `http://localhost:5000/api/products/${id}`;
        const method = isNewProduct ? "POST" : "PUT";

        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    category,
                    volume,
                    description,
                    image,
                    price: Number(price),
                    stock: Number(stock)
                })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: "Terjadi kesalahan saat memproses data produk." };
            }

            if (!response.ok) {
                throw new Error(data.message || "Gagal menyimpan produk");
            }

            document.getElementById("editModal").style.display = "none";
            showToast(isNewProduct ? "Produk berhasil ditambahkan!" : "Produk berhasil diperbarui!", "success");
            loadProducts();

        } catch (error) {
            console.error("Gagal menyimpan produk:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: error.message || 'Terjadi kesalahan saat menyimpan data produk.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = "Simpan";
        }
    });
}

// ======================
// HAPUS PRODUK
// ======================

window.deleteProduct = async function(id) {
    Swal.fire({
        title: 'Yakin hapus produk?',
        text: 'Data produk akan dihapus secara permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                let data;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    data = { message: "Gagal menghapus produk" };
                }

                if (!response.ok) {
                    throw new Error(data.message || "Gagal menghapus produk");
                }

                showToast("Produk berhasil dihapus!", "success");
                loadProducts();

            } catch (error) {
                console.error("Gagal menghapus produk:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus',
                    text: error.message || 'Terjadi kesalahan saat menghapus data produk.',
                    confirmButtonColor: '#0F5C3A'
                });
            }
        }
    });
};

// ======================
// CANCEL
// ======================

const cancelBtn = document.getElementById("cancelBtn");
if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
        document.getElementById("editModal").style.display = "none";
    });
}

// ======================
// REFRESH
// ======================

const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", loadProducts);
}

// ======================
// INIT
// ======================

loadProducts();
