// ==========================
// LOAD USER
// ==========================
const API_ENDPOINT = window.API_BASE || "https://maduna-backend.vercel.app";
async function loadUsers() {
    const totalUsersEl = document.getElementById("totalUsers");
    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_ENDPOINT}/api/admin/users`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const users = await response.json();
        if (totalUsersEl) {
            totalUsersEl.textContent = Array.isArray(users) ? users.length : 0;
        }

    } catch (error) {
        console.error("Gagal mengambil user:", error);
        if (totalUsersEl) {
            totalUsersEl.textContent = "-";
        }
    }
}

// ==========================
// LOAD ORDERS
// ==========================

let salesChartInstance = null;
let statusChartInstance = null;

async function loadOrders() {
    const table = document.getElementById("ordersTable");
    const totalOrdersEl = document.getElementById("totalOrders");
    const totalRevenueEl = document.getElementById("totalRevenue");

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_ENDPOINT}/api/admin/orders`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Gagal memuat pesanan (${response.status})`);
        }

        const orders = await response.json();
        if (!Array.isArray(orders)) {
            throw new Error("Format data pesanan tidak valid");
        }

        // Total Pesanan
        if (totalOrdersEl) {
            totalOrdersEl.textContent = orders.length;
        }

        // Hitung Pendapatan
        let totalRevenue = 0;
        orders.forEach(order => {
            totalRevenue += Number(order.total_price || 0);
        });

        if (totalRevenueEl) {
            totalRevenueEl.textContent = "Rp " + totalRevenue.toLocaleString("id-ID");
        }

        // Update tabel 5 pesanan terbaru (Aktivitas Terbaru)
        if (table) {
            table.innerHTML = "";
            
            if (orders.length === 0) {
                table.innerHTML = `
                    <tr>
                        <td colspan="5" class="text-center py-4 text-muted">
                            Belum ada aktivitas pesanan.
                        </td>
                    </tr>
                `;
            } else {
                orders.slice(0, 5).forEach(order => {
                    let badgeClass = "pending";
                    if(order.status === "dikirim") badgeClass = "shipped";
                    if(order.status === "selesai") badgeClass = "done";
                    if(order.status === "dibatalkan") badgeClass = "cancel";

                    table.innerHTML += `
                        <tr>
                            <td>${order.id}</td>
                            <td>${order.name || "-"}</td>
                            <td>${order.quantity || 0}</td>
                            <td>Rp ${Number(order.total_price || 0).toLocaleString("id-ID")}</td>
                            <td><span class="status ${badgeClass}">${order.status || "-"}</span></td>
                        </tr>
                    `;
                });
            }
        }

        // ==========================
        // RENDER CHARTS
        // ==========================
        const salesChartEl = document.getElementById("salesChart");
        const statusChartEl = document.getElementById("statusChart");
        const salesEmptyState = document.getElementById("salesEmptyState");
        const statusEmptyState = document.getElementById("statusEmptyState");

        if (orders.length > 0) {
            if (salesEmptyState) salesEmptyState.classList.add("d-none");
            if (statusEmptyState) statusEmptyState.classList.add("d-none");
            if (salesChartEl) salesChartEl.classList.remove("d-none");
            if (statusChartEl) statusChartEl.classList.remove("d-none");

            // Process data for charts
            let statusCounts = { pending: 0, dikirim: 0, selesai: 0, dibatalkan: 0 };
            let salesByDate = {};

            orders.forEach(order => {
                if(statusCounts[order.status] !== undefined) {
                    statusCounts[order.status]++;
                } else {
                    statusCounts[order.status] = 1;
                }

                if(order.order_date) {
                    let date = new Date(order.order_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
                    if(!salesByDate[date]) salesByDate[date] = 0;
                    salesByDate[date] += Number(order.total_price || 0);
                }
            });

            // Render Sales Chart (destroy previous instance if exists)
            if (salesChartEl) {
                if (salesChartInstance) salesChartInstance.destroy();
                const salesCtx = salesChartEl.getContext('2d');
                salesChartInstance = new Chart(salesCtx, {
                    type: 'line',
                    data: {
                        labels: Object.keys(salesByDate),
                        datasets: [{
                            label: 'Pendapatan (Rp)',
                            data: Object.values(salesByDate),
                            borderColor: '#0F5C3A',
                            backgroundColor: 'rgba(15, 92, 58, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: { y: { beginAtZero: true } }
                    }
                });
            }

            // Render Status Chart (destroy previous instance if exists)
            if (statusChartEl) {
                if (statusChartInstance) statusChartInstance.destroy();
                const statusCtx = statusChartEl.getContext('2d');
                statusChartInstance = new Chart(statusCtx, {
                    type: 'doughnut',
                    data: {
                        labels: ['Pending', 'Dikirim', 'Selesai', 'Dibatalkan'],
                        datasets: [{
                            data: [
                                statusCounts.pending, 
                                statusCounts.dikirim, 
                                statusCounts.selesai, 
                                statusCounts.dibatalkan
                            ],
                            backgroundColor: ['#FFC107', '#0dcaf0', '#198754', '#DC3545'],
                            borderWidth: 0
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        cutout: '75%',
                        plugins: {
                            legend: { position: 'bottom' }
                        }
                    }
                });
            }
        } else {
            if (salesEmptyState) salesEmptyState.classList.remove("d-none");
            if (statusEmptyState) statusEmptyState.classList.remove("d-none");
            if (salesChartEl) salesChartEl.classList.add("d-none");
            if (statusChartEl) statusChartEl.classList.add("d-none");
        }

    } catch (error) {
        console.error("Gagal mengambil pesanan:", error);
        if (totalOrdersEl) totalOrdersEl.textContent = "-";
        if (totalRevenueEl) totalRevenueEl.textContent = "-";
        if (table) {
            table.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4 text-danger">
                        <i class="bi bi-exclamation-triangle me-1"></i> Gagal memuat aktivitas pesanan. 
                        <a href="javascript:void(0)" onclick="loadOrders()" class="text-decoration-underline ms-1 fw-medium text-success">Coba Lagi</a>
                    </td>
                </tr>
            `;
        }
    }
}

// ==========================
// LOAD PRODUK
// ==========================

async function loadProduct() {
    const totalStockEl = document.getElementById("totalStock");
    try {
        const response = await fetch(`${API_ENDPOINT}/api/products`);
        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status}`);
        }

        const products = await response.json();
        let totalStock = 0;

        if (Array.isArray(products)) {
            products.forEach(product => {
                totalStock += Number(product.stock || 0);
            });
        }

        if (totalStockEl) {
            totalStockEl.textContent = totalStock;
        }

    } catch (error) {
        console.error("Gagal mengambil stok:", error);
        if (totalStockEl) {
            totalStockEl.textContent = "-";
        }
    }
}

// ==========================
// REPORT EXCEL
// ==========================

// Prepopulate years in modal
const exportYearInput = document.getElementById("exportYear");
const exportMonthSelect = document.getElementById("exportMonth");
if (exportYearInput) {
    exportYearInput.value = new Date().getFullYear();
}
if (exportMonthSelect) {
    exportMonthSelect.value = new Date().getMonth();
}

const downloadReportBtn = document.getElementById("downloadReportBtn");
if (downloadReportBtn) {
    downloadReportBtn.addEventListener("click", async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_ENDPOINT}/api/admin/orders`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error("Gagal mengambil data pesanan dari server.");
            }

            const allOrders = await response.json();
            if (!Array.isArray(allOrders)) {
                throw new Error("Format data tidak valid.");
            }
            
            const selectedMonth = parseInt(exportMonthSelect.value);
            const selectedYear = parseInt(exportYearInput.value);
            
            if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
                Swal.fire({
                    icon: 'error',
                    title: 'Tahun Tidak Valid',
                    text: 'Silakan masukkan tahun yang valid (2000 - 2100).',
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }
            
            const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const namaBulanBln = namaBulan[selectedMonth];
            
            const filteredOrders = allOrders.filter(order => {
                const dateValue = order.order_date || order.created_at || order.date;
                const orderDate = new Date(dateValue);
                return (order.status || "").toLowerCase() === "selesai" && 
                       orderDate.getMonth() === selectedMonth && 
                       orderDate.getFullYear() === selectedYear;
            });
            
            if (filteredOrders.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Data Kosong',
                    text: `Belum ada data penjualan selesai pada bulan ${namaBulanBln} ${selectedYear}.`,
                    confirmButtonColor: '#0F5C3A'
                });
                return;
            }
            
            let totalPesanan = filteredOrders.length;
            let totalQty = 0;
            let totalPendapatan = 0;
            
            filteredOrders.forEach(order => {
                totalQty += Number(order.quantity || 0);
                totalPendapatan += Number(order.total_price || 0);
            });
            
            function getBorder() {
                return {
                    top: { style: "thin", color: { rgb: "000000" } },
                    bottom: { style: "thin", color: { rgb: "000000" } },
                    left: { style: "thin", color: { rgb: "000000" } },
                    right: { style: "thin", color: { rgb: "000000" } }
                };
            }
            
            function formatTanggal(dateString) {
                if (!dateString) return "-";
                const dt = new Date(dateString);
                const d = String(dt.getDate()).padStart(2, '0');
                const m = String(dt.getMonth() + 1).padStart(2, '0');
                const y = dt.getFullYear();
                return `${d}/${m}/${y}`;
            }

            const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "0F5C3A" } }, border: getBorder() };
            
            const today = new Date();
            const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

            const aoa = [
                [{ v: "LAPORAN PENJUALAN MADUNA", s: { font: { bold: true, sz: 14 } } }],
                [],
                [{ v: "Periode :", s: { font: { bold: true } } }],
                [`${namaBulanBln} ${selectedYear}`],
                [],
                [{ v: "Tanggal Cetak :", s: { font: { bold: true } } }],
                [`(${dateStr})`],
                [],
                [{ v: "Total Pesanan", s: { font: { bold: true } } }, totalPesanan],
                [{ v: "Total Produk Terjual", s: { font: { bold: true } } }, totalQty],
                [{ v: "Total Pendapatan", s: { font: { bold: true } } }, `Rp${totalPendapatan.toLocaleString('id-ID')}`],
                [],
                [
                    { v: "No", s: headerStyle },
                    { v: "Tanggal", s: headerStyle },
                    { v: "ID Pesanan", s: headerStyle },
                    { v: "Nama Pelanggan", s: headerStyle },
                    { v: "Nama Produk", s: headerStyle },
                    { v: "Jumlah", s: headerStyle },
                    { v: "Harga Satuan", s: headerStyle },
                    { v: "Total", s: headerStyle },
                    { v: "Status", s: headerStyle }
                ]
            ];
            
            filteredOrders.forEach((order, index) => {
                const dateValue = order.order_date || order.created_at || order.date;
                const qty = Number(order.quantity) || 1;
                const hargaSatuan = Number(order.total_price) / qty;
                aoa.push([
                    { v: index + 1, s: { border: getBorder() } },
                    { v: formatTanggal(dateValue), s: { border: getBorder() } },
                    { v: `ORD-${String(order.id).padStart(3, '0')}`, s: { border: getBorder() } },
                    { v: order.name || "-", s: { border: getBorder() } },
                    { v: order.product_name || "-", s: { border: getBorder() } },
                    { v: order.quantity || 0, s: { border: getBorder() } },
                    { v: `Rp${Math.round(hargaSatuan).toLocaleString('id-ID')}`, s: { border: getBorder() } },
                    { v: `Rp${Number(order.total_price || 0).toLocaleString('id-ID')}`, s: { border: getBorder() } },
                    { v: "Selesai", s: { border: getBorder() } }
                ]);
            });
            
            const ws = XLSX.utils.aoa_to_sheet(aoa);
            
            ws['!cols'] = [
                { wch: 5 },
                { wch: 15 },
                { wch: 15 },
                { wch: 25 },
                { wch: 30 },
                { wch: 10 },
                { wch: 15 },
                { wch: 15 },
                { wch: 15 }
            ];
            
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Penjualan Bulanan");
            
            const fileName = `Laporan_Penjualan_Bulan_${namaBulanBln}_${selectedYear}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            // Tutup Modal
            const modalEl = document.getElementById("exportModal");
            if (modalEl) {
                const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                modalInstance.hide();
            }
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Laporan penjualan berhasil diunduh.',
                confirmButtonColor: '#0F5C3A'
            });
            
        } catch (error) {
            console.error("Gagal membuat report:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'Terjadi kesalahan saat membuat laporan.',
                confirmButtonColor: '#0F5C3A'
            });
        }
    });
}

// ==========================
// INIT
// ==========================

loadUsers();
loadOrders();
loadProduct();
