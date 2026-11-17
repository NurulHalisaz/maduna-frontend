// ====================
// SETUP KONEKSI API
// ====================
// Coba ambil URL dari config.js, jika tidak ada, gunakan URL Vercel secara langsung
const API_ENDPOINT = window.API_BASE || "https://maduna-backend.vercel.app";
const token = localStorage.getItem("token");

// ====================
// LOAD COMMENTS
// ====================

let allComments = [];
const searchCommentInput = document.getElementById('searchInput');
const sortFilter = document.getElementById('sortFilter');
const paginationInfo = document.getElementById('paginationInfo');

async function loadComments() {
    const table = document.getElementById("commentsTable");
    const totalEl = document.getElementById("totalComments");

    try {
        // PERBAIKAN: Gunakan API_ENDPOINT
        const response = await fetch(`${API_ENDPOINT}/api/comments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`Gagal mengambil komentar (${response.status})`);
        }

        allComments = await response.json();
        if (!Array.isArray(allComments)) {
            allComments = [];
        }

        if (totalEl) totalEl.textContent = allComments.length;
        applyCommentFilters();
    } catch (error) {
        console.error("Gagal mengambil komentar:", error);
        if (totalEl) totalEl.textContent = "-";
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-5">
                        <div class="empty-state text-danger">
                            <i class="bi bi-exclamation-triangle fs-1 mb-2 d-block"></i>
                            <p class="mb-2 fw-medium">Gagal memuat data komentar.</p>
                            <button class="btn btn-sm btn-outline-success rounded-pill px-3" onclick="loadComments()">
                                <i class="bi bi-arrow-clockwise me-1"></i> Coba Lagi
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }
        if (paginationInfo) paginationInfo.textContent = "Gagal memuat data";
    }
}

function renderComments(comments) {
    const table = document.getElementById("commentsTable");
    if (!table) return;
    table.innerHTML = "";

    if (comments.length === 0) {
        table.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="empty-state text-muted opacity-75">
                        <i class="bi bi-mailbox fs-1 mb-2 d-block"></i>
                        <p class="mb-0 fw-medium">Tidak ditemukan data yang sesuai.</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    comments.forEach(comment => {
        table.innerHTML += `
        <tr>
            <td>${comment.id}</td>
            <td class="fw-medium text-dark">${escapeHTML(comment.name)}</td>
            <td class="text-muted">${escapeHTML(comment.content)}</td>
            <td>${comment.created_at ? new Date(comment.created_at).toLocaleDateString("id-ID") : "-"}</td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button
                        class="btn btn-sm btn-outline-danger rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="deleteComment(${comment.id})">
                        <i class="bi bi-trash me-1"></i>Hapus
                    </button>
                </div>
            </td>
        </tr>
        `;
    });
}

function escapeHTML(str) {
    if (!str) return "";
    return String(str).replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ====================
// SEARCH & SORT LOGIC
// ====================

function applyCommentFilters() {
    const keyword = (searchCommentInput?.value || "").toLowerCase().trim();
    const sortVal = sortFilter?.value || "terbaru";

    let filtered = allComments.filter(c => 
        (c.name || "").toLowerCase().includes(keyword) || 
        (c.content || "").toLowerCase().includes(keyword)
    );

    filtered.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : Number(a.id);
        const dateB = b.created_at ? new Date(b.created_at).getTime() : Number(b.id);
        return sortVal === "terlama" ? (dateA - dateB) : (dateB - dateA);
    });

    renderComments(filtered);
    updatePaginationInfo(filtered.length, allComments.length);
}

function updatePaginationInfo(filteredCount, totalCount) {
    if (!paginationInfo) return;
    if (totalCount === 0) {
        paginationInfo.textContent = "Belum ada komentar";
    } else if (filteredCount === totalCount) {
        paginationInfo.textContent = `Menampilkan seluruh ${totalCount} komentar`;
    } else {
        paginationInfo.textContent = `Menampilkan ${filteredCount} dari ${totalCount} komentar`;
    }
}

searchCommentInput?.addEventListener('input', applyCommentFilters);
sortFilter?.addEventListener('change', applyCommentFilters);

// ====================
// DELETE COMMENT
// ====================

window.deleteComment = async function(id) {
    Swal.fire({
        title: 'Yakin hapus komentar?',
        text: 'Komentar yang dihapus tidak dapat dikembalikan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus',
        cancelButtonText: 'Batal'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                // PERBAIKAN: Gunakan API_ENDPOINT
                const response = await fetch(`${API_ENDPOINT}/api/comments/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });

                let data;
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                    data = await response.json();
                } else {
                    data = { message: "Gagal menghapus komentar" };
                }

                if (!response.ok) {
                    throw new Error(data.message || "Gagal menghapus komentar");
                }

                showToast("Komentar berhasil dihapus!", "success");
                loadComments();

            } catch (error) {
                console.error("Gagal menghapus komentar:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Menghapus',
                    text: error.message || 'Terjadi kesalahan saat menghapus komentar.',
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
    refreshBtn.addEventListener("click", loadComments);
}

// ====================
// TOAST NOTIFICATION UTILITY
// ====================
function showToast(message, type = "success") {
    // Pastikan Anda memiliki framework Toast di HTML (misal SweetAlert2 mixin atau Bootstrap Toast)
    // Jika tidak ada, fallback ke Swal.fire standard
    if (typeof Swal !== 'undefined') {
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        });
        Toast.fire({
            icon: type,
            title: message
        });
    } else {
        alert(message);
    }
}

// ====================
// INIT
// ====================
loadComments();
