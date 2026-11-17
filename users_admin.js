let allUsers = [];

// ======================
// LOAD USERS
// ======================

async function loadUsers() {
    const table = document.getElementById("usersTable");
    const totalEl = document.getElementById("totalUsers");

    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:5000/api/admin/users", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Gagal memuat pengguna (${response.status})`);
        }

        allUsers = await response.json();
        if (!Array.isArray(allUsers)) {
            allUsers = [];
        }

        if (totalEl) totalEl.textContent = allUsers.length;
        applyUserFilters();
    } catch (err) {
        console.error("Gagal mengambil data user:", err);
        if (totalEl) totalEl.textContent = "-";
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center py-5">
                        <div class="empty-state text-danger">
                            <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                            <p class="mb-2 fw-medium">Gagal memuat data pengguna.</p>
                            <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="loadUsers()">
                                <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
    }
}

function renderUsers(users) {
    const table = document.getElementById("usersTable");
    if (!table) return;
    table.innerHTML = "";

    if (users.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-5">
                    <div class="empty-state text-muted opacity-75">
                        <i class="bi bi-mailbox fs-1 mb-2 d-block"></i>
                        <p class="mb-0 fw-medium">Tidak ditemukan data yang sesuai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const roleClass = user.role === "admin" ? "role-admin" : "role-customer";

        table.innerHTML += `
        <tr>
            <td>${user.id}</td>
            <td class="fw-medium text-dark">${user.name || "-"}</td>
            <td>${user.email || "-"}</td>
            <td><span class="${roleClass}">${user.role || "-"}</span></td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"}</td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button
                        class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="openEditModal(${user.id}, '${escapeQuote(user.name)}', '${escapeQuote(user.email)}', '${user.role}')">
                        <i class="bi bi-pencil-square me-1"></i>Edit
                    </button>
                    <button
                        class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="deleteUser(${user.id})">
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
const searchUserInput = document.getElementById('searchInput');
const roleFilter = document.getElementById('roleFilter');
const userPaginationInfo = document.getElementById('paginationInfo');

function applyUserFilters() {
    const keyword = (searchUserInput?.value || "").toLowerCase().trim();
    const selectedRole = (roleFilter?.value || "").toLowerCase().trim();

    const filtered = allUsers.filter(u => {
        const matchesKeyword = !keyword || 
            (u.name || "").toLowerCase().includes(keyword) || 
            (u.email || "").toLowerCase().includes(keyword);

        const matchesRole = !selectedRole || 
            (u.role || "").toLowerCase() === selectedRole;

        return matchesKeyword && matchesRole;
    });

    renderUsers(filtered);
    updateUserPaginationInfo(filtered.length, allUsers.length);
}

function updateUserPaginationInfo(filteredCount, totalCount) {
    if (!userPaginationInfo) return;
    if (totalCount === 0) {
        userPaginationInfo.textContent = "Belum ada pengguna";
    } else if (filteredCount === totalCount) {
        userPaginationInfo.textContent = `Menampilkan seluruh ${totalCount} pengguna`;
    } else {
        userPaginationInfo.textContent = `Menampilkan ${filteredCount} dari ${totalCount} pengguna`;
    }
}

searchUserInput?.addEventListener('input', applyUserFilters);
roleFilter?.addEventListener('change', applyUserFilters);

// ======================
// REFRESH
// ======================

const refreshBtn = document.getElementById("refreshBtn");
if (refreshBtn) {
    refreshBtn.addEventListener("click", loadUsers);
}

// ======================
// MODAL EDIT
// ======================

function openEditModal(id, name, email, role) {
    const modal = document.getElementById("editModal");
    if (modal) modal.style.display = "flex";

    document.getElementById("editUserId").value = id || "";
    document.getElementById("editName").value = name || "";
    document.getElementById("editEmail").value = email || "";
    document.getElementById("editRole").value = role || "customer";
}

const closeModalBtn = document.getElementById("closeModalBtn");
if (closeModalBtn) {
    closeModalBtn.addEventListener("click", () => {
        const modal = document.getElementById("editModal");
        if (modal) modal.style.display = "none";
    });
}

// ======================
// UPDATE USER
// ======================

const saveUserBtn = document.getElementById("saveUserBtn");
if (saveUserBtn) {
    saveUserBtn.addEventListener("click", async () => {
        const id = document.getElementById("editUserId").value;
        const name = document.getElementById("editName").value.trim();
        const email = document.getElementById("editEmail").value.trim();
        const role = document.getElementById("editRole").value;

        if (!name || !email) {
            Swal.fire({
                icon: 'warning',
                title: 'Data Belum Lengkap',
                text: 'Nama dan email wajib diisi.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Swal.fire({
                icon: 'warning',
                title: 'Format Email Salah',
                text: 'Silakan masukkan alamat email yang valid.',
                confirmButtonColor: '#0F5C3A'
            });
            return;
        }

        saveUserBtn.disabled = true;
        saveUserBtn.textContent = "Menyimpan...";

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name, email, role })
            });

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            } else {
                data = { message: "Gagal memperbarui pengguna" };
            }

            if (!response.ok) {
                throw new Error(data.message || "Gagal memperbarui data pengguna");
            }

            document.getElementById("editModal").style.display = "none";
            showToast("Data pengguna berhasil diperbarui!", "success");
            loadUsers();

        } catch (error) {
            console.error("Gagal update user:", error);
            Swal.fire({
                icon: 'error',
                title: 'Gagal Update',
                text: error.message || 'Terjadi kesalahan saat memperbarui pengguna.',
                confirmButtonColor: '#0F5C3A'
            });
        } finally {
            saveUserBtn.disabled = false;
            saveUserBtn.textContent = "Simpan Perubahan";
        }
    });
}

// ======================
// DELETE USER
// ======================

window.deleteUser = async function(id) {
    Swal.fire({
        title: 'Yakin hapus user?',
        text: 'Data pengguna akan dihapus permanen dari sistem.',
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
                const response = await fetch(`http://localhost:5000/api/admin/users/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                let data;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    data = { message: "Gagal menghapus pengguna" };
                }

                if (!response.ok) {
                    throw new Error(data.message || "Gagal menghapus pengguna");
                }

                showToast("Pengguna berhasil dihapus!", "success");
                loadUsers();

            } catch (error) {
                console.error("Gagal menghapus user:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus',
                    text: error.message || 'Terjadi kesalahan saat menghapus pengguna.',
                    confirmButtonColor: '#0F5C3A'
                });
            }
        }
    });
};

// ======================
// INIT
// ======================

loadUsers();
