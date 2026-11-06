const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

// ====================
// PROTEKSI ADMIN
// ====================

const role = localStorage.getItem("role");

if(role !== "admin"){
    alert("Akses ditolak");
    window.location.href = "login.html";
}

// ====================
// ELEMENT
// ====================

const table = document.getElementById("ordersTable");
const modal = document.getElementById("statusModal");
const orderIdInput = document.getElementById("orderId");
const statusSelect = document.getElementById("statusSelect");

let allOrders = [];

// ====================
// LOAD ORDERS
// ====================

async function loadOrders(){
    try{
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_ENDPOINT}/api/admin/orders`, {
            headers:{ Authorization: `Bearer ${token}` }
        });

        allOrders = await response.json();
        renderOrders(allOrders);
    } catch(err){
        console.error(err);
        alert("Gagal mengambil data pesanan");
    }
}

function renderOrders(orders) {
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
            <td class="fw-medium text-dark">${order.name}</td>
            <td>${order.quantity}</td>
            <td class="fw-semibold text-primary">Rp ${Number(order.total_price).toLocaleString("id-ID")}</td>
            <td><span class="status ${badge}">${order.status}</span></td>
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

// REALTIME SEARCH
document.getElementById('searchInput')?.addEventListener('input', function(e) {
    const keyword = e.target.value.toLowerCase();
    const filtered = allOrders.filter(o => 
        o.name.toLowerCase().includes(keyword) || 
        o.id.toString().includes(keyword) ||
        o.status.toLowerCase().includes(keyword)
    );
    renderOrders(filtered);
});

// ====================
// MODAL
// ====================

function openModal(
    id,
    status
){

    modal.style.display =
        "flex";

    orderIdInput.value =
        id;

    statusSelect.value =
        status;
}

document
.getElementById(
    "closeModalBtn"
)
.addEventListener(
    "click",
    ()=>{

        modal.style.display =
            "none";

    }
);

// ====================
// UPDATE STATUS
// ====================

document
.getElementById(
    "saveStatusBtn"
)
.addEventListener(
    "click",
    async ()=>{

        try{

            const token =
                localStorage
                .getItem("token");

            await fetch(
                `${API_ENDPOINT}/api/admin/orders/${orderIdInput.value}`,
                {
                    method:"PUT",

                    headers:{
                        "Content-Type":
                        "application/json",

                        Authorization:
                        `Bearer ${token}`
                    },

                    body:JSON.stringify({
                        status:
                        statusSelect.value
                    })
                }
            );

            modal.style.display =
                "none";

            loadOrders();
            // Definisi dipindahkan atau disesuaikan
            window.cancelOrder = async function(id){
                Swal.fire({
                    title: 'Yakin batalkan pesanan?',
                    text: 'Aksi ini tidak dapat dikembalikan.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonColor: '#DC3545',
                    cancelButtonColor: '#6c757d',
                    confirmButtonText: 'Ya, Batalkan'
                }).then(async (result) => {
                    if(result.isConfirmed) {
                        const token = localStorage.getItem("token");
                        await fetch(`${API_ENDPOINT}/api/admin/orders/${id}/cancel`, {
                            method:"PUT",
                            headers:{ Authorization: `Bearer ${token}` }
                        });
                        loadOrders();
                    }
                });
            }

        }catch(error){

            console.error(error);

        }

    }
);

// ====================
// REFRESH
// ====================

document
.getElementById(
    "refreshBtn"
)
.addEventListener(
    "click",
    loadOrders
);

// ====================
// INIT
// ====================

loadOrders();