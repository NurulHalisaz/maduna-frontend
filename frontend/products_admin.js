const API_ENDPOINT = window.API_BASE || "http://localhost:5000";
const token = localStorage.getItem("token");

let allProducts = [];
let filteredProducts = [];
let currentPage = 1;
const itemsPerPage = 5;

// ======================
// LOAD PRODUK
// ======================

async function loadProducts() {
    try {
        const response = await fetch(`${API_ENDPOINT}/api/products`);
        if (!response.ok) throw new Error("Gagal mengambil data produk");

        allProducts = await response.json();
        filteredProducts = [...allProducts];
        
        const totalEl = document.getElementById("totalProducts");
        if (totalEl) totalEl.textContent = allProducts.length;

        currentPage = 1;
        renderPaginatedProducts();
    } catch (error) {
        console.error("Load products error:", error);
        if (window.showToast) {
            window.showToast("Gagal mengambil data produk", "error");
        }
    }
}

function renderPaginatedProducts() {
    const totalItems = filteredProducts.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = startIdx + itemsPerPage;
    const paginatedItems = filteredProducts.slice(startIdx, endIdx);

    renderProducts(paginatedItems);
    renderPaginationControls(totalItems, totalPages);
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
                        <i class="bi bi-box-seam fs-1 mb-2 d-block"></i>
                        <p class="mb-0 fw-medium">Tidak ada data produk yang ditemukan.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    products.forEach(product => {
        const gambar = product.image ? `assets/${product.image}` : "assets/satu-botol.png";
        const descSafe = (product.description || "").replace(/"/g, "&quot;").replace(/'/g, "\\'");

        table.innerHTML += `
        <tr>
            <td>${product.id}</td>
            <td>
                <img src="${gambar}" onerror="this.onerror=null; this.src='assets/satu-botol.png';" class="product-img shadow-sm rounded-3" alt="${product.name}" style="width: 50px; height: 50px; object-fit: cover;">
            </td>
            <td class="fw-medium text-dark">${product.name}</td>
            <td>${product.volume || "-"}</td>
            <td class="fw-semibold text-primary">Rp ${Number(product.price).toLocaleString("id-ID")}</td>
            <td>
                <span class="badge ${product.stock > 5 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} rounded-pill px-3 py-2 fw-semibold">
                    ${product.stock}
                </span>
            </td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button
                        class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="openEditModal(${product.id}, '${product.name.replace(/'/g, "\\'")}', '${(product.category || "").replace(/'/g, "\\'")}', '${(product.volume || "").replace(/'/g, "\\'")}', '${descSafe}', '${product.image || ""}', ${product.price}, ${product.stock})">
                        <i class="bi bi-pencil-square me-1"></i>Edit
                    </button>
                    <button
                        class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="deleteProduct(${product.id}, '${product.name.replace(/'/g, "\\'")}')">
                        <i class="bi bi-trash me-1"></i>Hapus
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
}

function renderPaginationControls(totalItems, totalPages) {
    const infoEl = document.getElementById("paginationInfo");
    const container = document.getElementById("paginationContainer");
    if (!infoEl || !container) return;

    infoEl.textContent = `Menampilkan ${totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1} - ${Math.min(currentPage * itemsPerPage, totalItems)} dari ${totalItems} produk (Hal. ${currentPage}/${totalPages})`;
    container.innerHTML = "";

    if (totalPages <= 1) return;

    // Previous Button
    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link px-3 rounded-start-3" href="javascript:void(0)" aria-label="Previous"><i class="bi bi-chevron-left"></i></a>`;
    prevLi.onclick = () => {
        if (currentPage > 1) {
            currentPage--;
            renderPaginatedProducts();
        }
    };
    container.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const pageLi = document.createElement("li");
        pageLi.className = `page-item ${i === currentPage ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="javascript:void(0)">${i}</a>`;
        pageLi.onclick = () => {
            currentPage = i;
            renderPaginatedProducts();
        };
        container.appendChild(pageLi);
    }

    // Next Button
    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link px-3 rounded-end-3" href="javascript:void(0)" aria-label="Next"><i class="bi bi-chevron-right"></i></a>`;
    nextLi.onclick = () => {
        if (currentPage < totalPages) {
            currentPage++;
            renderPaginatedProducts();
        }
    };
    container.appendChild(nextLi);
}

// REALTIME SEARCH
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const keyword = e.target.value.toLowerCase().trim();
    filteredProducts = allProducts.filter(p => 
        (p.name && p.name.toLowerCase().includes(keyword)) ||
        (p.category && p.category.toLowerCase().includes(keyword)) ||
        (p.volume && p.volume.toLowerCase().includes(keyword))
    );
    currentPage = 1;
    renderPaginatedProducts();
});

// ======================
// MODAL EDIT & TAMBAH
// ======================

function openEditModal(id, name, category, volume, description, image, price, stock) {
    const editModal = document.getElementById("editModal");
    if (!editModal) return;

    editModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Edit Produk";

    document.getElementById("editId").value = id || "";
    document.getElementById("editName").value = name || "";
    document.getElementById("editCategory").value = category || "";
    document.getElementById("editVolume").value = volume || "";
    document.getElementById("editDescription").value = description || "";
    document.getElementById("editImage").value = image || "";
    document.getElementById("editPrice").value = price || "";
    document.getElementById("editStock").value = stock || "";

    const preview = document.getElementById("previewImage");
    if (preview) {
        if (image) {
            preview.src = `assets/${image}`;
            preview.style.display = "block";
        } else {
            preview.style.display = "none";
        }
    }
}

window.openAddModal = function() {
    const editModal = document.getElementById("editModal");
    if (!editModal) return;

    editModal.style.display = "flex";
    document.getElementById("modalTitle").textContent = "Tambah Produk Baru";

    document.getElementById("editId").value = "";
    document.getElementById("editName").value = "";
    document.getElementById("editCategory").value = "";
    document.getElementById("editVolume").value = "";
    document.getElementById("editDescription").value = "";
    document.getElementById("editImage").value = "";
    document.getElementById("editPrice").value = "";
    document.getElementById("editStock").value = "";

    const preview = document.getElementById("previewImage");
    if (preview) preview.style.display = "none";
};

// ======================
// CHOOSE FILE
// ======================

const imageFile = document.getElementById("editImageFile");
if (imageFile) {
    imageFile.addEventListener("change", function() {
        if (this.files.length > 0) {
            const fileName = this.files[0].name;
            document.getElementById("editImage").value = fileName;

            const preview = document.getElementById("previewImage");
            if (preview) {
                preview.src = URL.createObjectURL(this.files[0]);
                preview.style.display = "block";
            }
        }
    });
}

// ======================
// SIMPAN PRODUK
// ======================

const saveBtn = document.getElementById("saveBtn");
if (saveBtn) {
    saveBtn.addEventListener("click", async () => {
        const id = document.getElementById("editId").value;
        const name = document.getElementById("editName").value.trim();
        const price = document.getElementById("editPrice").value;
        const stock = document.getElementById("editStock").value;

        if (!name || !price || !stock) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Nama, harga, dan stok produk wajib diisi!',
                confirmButtonColor: '#1F5533'
            });
            return;
        }

        const isNewProduct = id === "";
        const url = isNewProduct ? `${API_ENDPOINT}/api/products` : `${API_ENDPOINT}/api/products/${id}`;
        const method = isNewProduct ? "POST" : "PUT";

        saveBtn.disabled = true;
        saveBtn.textContent = "Menyimpan...";

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    category: document.getElementById("editCategory").value.trim(),
                    volume: document.getElementById("editVolume").value.trim(),
                    description: document.getElementById("editDescription").value.trim(),
                    image: document.getElementById("editImage").value.trim(),
                    price: Number(price),
                    stock: Number(stock)
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Gagal menyimpan produk");
            }

            document.getElementById("editModal").style.display = "none";
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil!',
                text: result.message || 'Data produk berhasil disimpan.',
                timer: 1500,
                showConfirmButton: false
            });

            loadProducts();
        } catch (error) {
            console.error("Save product error:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal',
                text: error.message || 'Terjadi kesalahan saat menyimpan produk.',
                confirmButtonColor: '#1F5533'
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

window.deleteProduct = async function(id, name) {
    Swal.fire({
        title: `Hapus ${name || 'produk'}?`,
        text: 'Data produk ini akan dihapus secara permanen dari database.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_ENDPOINT}/api/products/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                
                const resData = await response.json();
                if (!response.ok) throw new Error(resData.message || "Gagal menghapus produk");

                Swal.fire({
                    icon: 'success',
                    title: 'Terhapus!',
                    text: 'Produk berhasil dihapus.',
                    timer: 1500,
                    showConfirmButton: false
                });

                loadProducts();
            } catch (error) {
                console.error("Delete product error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal',
                    text: error.message || 'Gagal menghapus produk',
                    confirmButtonColor: '#1F5533'
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
// INIT
// ======================

loadProducts();
