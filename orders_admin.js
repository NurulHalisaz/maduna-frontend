// ====================
// ELEMENT
// ====================

const table = document.getElementById("ordersTable");
const modal = document.getElementById("statusModal");
const orderIdInput = document.getElementById("orderId");
const statusSelect = document.getElementById("statusSelect");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const paginationInfo = document.getElementById("paginationInfo");

let allOrders = [];

// ====================
// LOAD ORDERS
// ====================

async function loadOrders() {
    if (!table) return;
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/admin/orders", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Gagal mengambil data pesanan (${response.status})`);
        }

        allOrders = await response.json();
        if (!Array.isArray(allOrders)) {
            allOrders = [];
        }
        
        applyFilters();
    } catch (err) {
        console.error("Gagal memuat pesanan:", err);
        table.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-5">
                    <div class="empty-state text-danger">
                        <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                        <p class="mb-2 fw-medium">Gagal memuat data pesanan.</p>
                        <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="loadOrders()">
                            <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                        </button>
                    </div>
                </td>
            </tr>
        `;
        if (paginationInfo) paginationInfo.textContent = "Gagal memuat data";
    }
}

function renderOrders(orders) {
    if (!table) return;
    table.innerHTML = "";

    if (orders.length === 0) {
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

    orders.forEach(order => {
        let badge = "pending";
        if(order.status === "dikirim") badge = "shipped";
        if(order.status === "selesai") badge = "done";
        if(order.status === "dibatalkan") badge = "cancel";

        table.innerHTML += `
        <tr>
            <td class="fw-medium">${order.id}</td>
            <td class="fw-medium text-dark">${order.name || "-"}</td>
            <td>${order.quantity || 0}</td>
            <td class="fw-semibold text-primary">Rp ${Number(order.total_price || 0).toLocaleString("id-ID")}</td>
            <td><span class="status ${badge}">${order.status || "-"}</span></td>
            <td>${order.order_date ? new Date(order.order_date).toLocaleDateString('id-ID') : '-'}</td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium d-flex align-items-center" onclick="openModal(${order.id}, '${order.status}')">
                        <i class="bi bi-pencil-square me-1"></i>Update
                    </button>
                    ${order.status === "pending" ? `<button class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-medium d-flex align-items-center" onclick="cancelOrder(${order.id})"><i class="bi bi-x-circle me-1"></i>Batal</button>` : ""}
                </div>
            </td>
        </tr>
        `;
    });
}

// ====================
// FILTER & SEARCH LOGIC
// ====================

function applyFilters() {
    const keyword = (searchInput?.value || "").toLowerCase().trim();
    const selectedStatus = (statusFilter?.value || "").toLowerCase().trim();

    const filtered = allOrders.filter(order => {
        const matchesKeyword = !keyword || 
            (order.name || "").toLowerCase().includes(keyword) || 
            String(order.id).toLowerCase().includes(keyword);

        const matchesStatus = !selectedStatus || 
            (order.status || "").toLowerCase() === selectedStatus;

        return matchesKeyword && matchesStatus;
    });

    renderOrders(filtered);
    updatePaginationInfo(filtered.length, allOrders.length);
}

function updatePaginationInfo(filteredCount, totalCount) {
    if (!paginationInfo) return;
    if (totalCount === 0) {
        paginationInfo.textContent = "Belum ada pesanan";
    } else if (filteredCount === totalCount) {
        paginationInfo.textContent = `Menampilkan seluruh ${totalCount} pesanan`;
    } else {
        paginationInfo.textContent = `Menampilkan ${filteredCount} dari ${totalCount} pesanan`;
    }
}

// Event Listeners Filter
searchInput?.addEventListener('input', applyFilters);
statusFilter?.addEventListener('change', applyFilters);

// ====================
// MODAL
// ====================

window.openModal = function(id, status) {
    if (modal) modal.style.display = "flex";
    if (orderIdInput) orderIdInput.value = id;
    if (statusSelect) statusSelect.value = status;
};

const closeModalBtn = document.getElementById("closeModalBtn");
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        if (modal) modal.style.display = "none";
    });
}

// ====================
// UPDATE STATUS
// ====================

const saveStatusBtn = document.getElementById("saveStatusBtn");
if (saveStatusBtn) {
    saveStatusBtn.addEventListener("click", async () => {
        const id = orderIdInput.value;
        const newStatus = statusSelect.value;

        if (!id || !newStatus) return;

        saveStatusBtn.disabled = true;
        saveStatusBtn.textContent = "Menyimpan...";

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/admin/orders/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: "Gagal memperbarui status" };
            }

            if (!response.ok) {
                throw new Error(data.message || "Gagal mengubah status pesanan");
            }

            if (modal) modal.style.display = "none";
            showToast("Status pesanan berhasil diperbarui!", "success");
            loadOrders();

        } catch (error) {
            console.error("Gagal update status pesanan:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Update',
                text: error.message || 'Terjadi kesalahan saat memperbarui status pesanan.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            saveStatusBtn.disabled = false;
            saveStatusBtn.textContent = "Simpan Perubahan";
        }
    });
}

// ====================
// BATALKAN PESANAN
// ====================

window.cancelOrder = async function(id) {
    Swal.fire({
        title: 'Yakin batalkan pesanan?',
        text: 'Pesanan yang dibatalkan tidak dapat dikembalikan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Batalkan',
        cancelButtonText: 'Tutup'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:5000/api/admin/orders/${id}/cancel`, {
                    method: "PUT",
                    headers: { Authorization: `Bearer ${token}` }
                });

                let data;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    data = { message: "Gagal membatalkan pesanan" };
                }

                if (!response.ok) {
                    throw new Error(data.message || "Gagal membatalkan pesanan");
                }

                showToast("Pesanan berhasil dibatalkan!", "success");
                loadOrders();

            } catch (error) {
                console.error("Gagal membatalkan pesanan:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Membatalkan',
                    text: error.message || 'Terjadi kesalahan saat membatalkan pesanan.',
                    confirmButtonColor: '#0F5C3A'
                });
            }
        }
    });
};

// ====================
// REFRESH
// ====================

const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", loadOrders);
}

// ====================
// INIT
// ====================

loadOrders();
