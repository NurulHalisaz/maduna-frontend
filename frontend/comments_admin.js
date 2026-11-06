const API_ENDPOINT = window.API_BASE || "http://localhost:5000";
const token =
localStorage.getItem("token");

// ====================
// LOAD COMMENTS
// ====================

let allComments = [];

async function loadComments(){
    try{
        const response = await fetch(`${API_ENDPOINT}/api/comments`, {
            headers:{ Authorization: `Bearer ${token}` }
        });

        allComments = await response.json();
        document.getElementById("totalComments").textContent = allComments.length;
        renderComments(allComments);
    }catch(error){
        console.error(error);
        alert("Gagal mengambil komentar");
    }
}

function renderComments(comments) {
    const table = document.getElementById("commentsTable");
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
            <td class="fw-medium text-dark">${comment.name}</td>
            <td class="text-muted">${comment.content}</td>
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

// REALTIME SEARCH
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const keyword = e.target.value.toLowerCase();
    const filtered = allComments.filter(c => 
        c.name.toLowerCase().includes(keyword) || 
        c.content.toLowerCase().includes(keyword)
    );
    renderComments(filtered);
});

// ====================
// DELETE COMMENT
// ====================

window.deleteComment = async function(id){
    Swal.fire({
        title: 'Yakin hapus komentar?',
        text: 'Komentar yang dihapus tidak dapat dikembalikan.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
        if(result.isConfirmed) {
            try{
                await fetch(`${API_ENDPOINT}/api/comments/${id}`, {
                    method:"DELETE",
                    headers:{ Authorization: `Bearer ${token}` }
                });
                loadComments();
            }catch(error){
                console.error(error);
                alert("Gagal menghapus komentar");
            }
        }
    });
}

// ====================
// REFRESH
// ====================

document
.getElementById("refreshBtn")
.addEventListener(
    "click",
    loadComments
);

// ====================
// INIT
// ====================

loadComments();