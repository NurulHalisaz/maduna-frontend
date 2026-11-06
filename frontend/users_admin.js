const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

// ======================
// PROTEKSI ADMIN
// ======================

const role = localStorage.getItem("role");

if(role !== "admin"){
    alert("Akses ditolak");
    window.location.href = "login.html";
}

let allUsers = [];

// ======================
// LOAD USERS
// ======================

async function loadUsers(){
    try{
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_ENDPOINT}/api/admin/users`, {
            headers:{ Authorization: `Bearer ${token}` }
        });

        allUsers = await response.json();
        document.getElementById("totalUsers").textContent = allUsers.length;
        renderUsers(allUsers);
    }catch(err){
        console.error(err);
        alert("Gagal mengambil data user");
    }
}

function renderUsers(users) {
    const table = document.getElementById("usersTable");
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
            <td class="fw-medium text-dark">${user.name}</td>
            <td>${user.email}</td>
            <td><span class="${roleClass}">${user.role}</span></td>
            <td>${user.created_at ? new Date(user.created_at).toLocaleDateString("id-ID") : "-"}</td>
            <td>
                <div class="d-flex justify-content-center align-items-center gap-2 text-nowrap">
                    <button
                        class="btn btn-sm btn-outline-primary rounded-pill px-3 fw-medium d-flex align-items-center"
                        onclick="openEditModal(${user.id}, '${user.name}', '${user.email}', '${user.role}')">
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

// REALTIME SEARCH
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const keyword = e.target.value.toLowerCase();
    const filtered = allUsers.filter(u => 
        u.name.toLowerCase().includes(keyword) || 
        u.email.toLowerCase().includes(keyword) ||
        u.role.toLowerCase().includes(keyword)
    );
    renderUsers(filtered);
});

// ======================
// REFRESH
// ======================

document
.getElementById(
    "refreshBtn"
)
.addEventListener(
    "click",
    loadUsers
);

// ======================
// MODAL EDIT
// ======================

function openEditModal(
    id,
    name,
    email,
    role
){

    document
    .getElementById("editModal")
    .style.display = "flex";

    document
    .getElementById("editUserId")
    .value = id;

    document
    .getElementById("editName")
    .value = name;

    document
    .getElementById("editEmail")
    .value = email;

    document
    .getElementById("editRole")
    .value = role;
}

document
.getElementById("closeModalBtn")
.addEventListener(
    "click",
    ()=>{

        document
        .getElementById("editModal")
        .style.display = "none";

    }
);

// ======================
// UPDATE USER
// ======================

document
.getElementById("saveUserBtn")
.addEventListener(
    "click",
    async ()=>{

        const token =
            localStorage.getItem("token");

        const id =
            document
            .getElementById(
                "editUserId"
            ).value;

        await fetch(
            `${API_ENDPOINT}/api/admin/users/${id}`,
            {
                method:"PUT",

                headers:{
                    "Content-Type":
                    "application/json",

                    Authorization:
                    `Bearer ${token}`
                },

                body:JSON.stringify({

                    name:
                    document.getElementById("editName").value,

                    email:
                    document.getElementById("editEmail").value,

                    role:
                    document.getElementById("editRole").value

                })
            }
        );

        document
        .getElementById("editModal")
        .style.display = "none";

        loadUsers();

    }
);

// ======================
// DELETE USER
// ======================

window.deleteUser = async function(id){
    Swal.fire({
        title: 'Yakin hapus user?',
        text: 'Data pengguna akan dihapus permanen.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#DC3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Hapus'
    }).then(async (result) => {
        if(result.isConfirmed) {
            const token = localStorage.getItem("token");
            await fetch(`${API_ENDPOINT}/api/admin/users/${id}`, {
                method:"DELETE",
                headers:{ Authorization: `Bearer ${token}` }
            });
            loadUsers();
        }
    });
}