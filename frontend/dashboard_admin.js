const API_ENDPOINT = window.API_BASE || "http://localhost:5000";

// ==========================
// LOAD USER
// ==========================

async function loadUsers() {

    try {

        const token =
            localStorage.getItem("token");

        const response =
            await fetch(
                `${API_ENDPOINT}/api/admin/users`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const users =
            await response.json();

        document
            .getElementById("totalUsers")
            .textContent =
            users.length;

    } catch (error) {

        console.error(
            "Gagal mengambil user",
            error
        );

    }

}

// ==========================
// LOAD ORDERS
// ==========================

async function loadOrders() {

    try {

        const token =
            localStorage.getItem("token");

        const response =
            await fetch(
                `${API_ENDPOINT}/api/admin/orders`,
                {
                    headers: {
                        Authorization:
                            `Bearer ${token}`
                    }
                }
            );

        const orders =
            await response.json();

        // Total Pesanan

        document
            .getElementById("totalOrders")
            .textContent =
            orders.length;

        // Hitung Pendapatan

        let totalRevenue = 0;

        orders.forEach(order => {

            totalRevenue +=
                Number(order.total_price);

        });

        document
            .getElementById("totalRevenue")
            .textContent =
            "Rp " +
            totalRevenue.toLocaleString("id-ID");

        // Update tabel 5 pesanan terbaru (Aktivitas Terbaru)
        const table = document.getElementById("ordersTable");
        table.innerHTML = "";
        
        // Render 5 terbaru
        orders.slice(0, 5).forEach(order => {
            let badgeClass = "pending";
            if(order.status === "dikirim") badgeClass = "shipped";
            if(order.status === "selesai") badgeClass = "done";
            if(order.status === "dibatalkan") badgeClass = "cancel";

            table.innerHTML += `
                <tr>
                    <td>${order.id}</td>
                    <td>${order.name}</td>
                    <td>${order.quantity}</td>
                    <td>Rp ${Number(order.total_price).toLocaleString("id-ID")}</td>
                    <td><span class="status ${badgeClass}">${order.status}</span></td>
                </tr>
            `;
        });

        // ==========================
        // RENDER CHARTS
        // ==========================
        if(orders.length > 0) {
            document.getElementById("salesEmptyState").classList.add("d-none");
            document.getElementById("statusEmptyState").classList.add("d-none");
            document.getElementById("salesChart").classList.remove("d-none");
            document.getElementById("statusChart").classList.remove("d-none");

            // Process data for charts
            let statusCounts = { pending: 0, dikirim: 0, selesai: 0, dibatalkan: 0 };
            let salesByDate = {};

            orders.forEach(order => {
                // Status
                if(statusCounts[order.status] !== undefined) {
                    statusCounts[order.status]++;
                } else {
                    statusCounts[order.status] = 1;
                }

                // Sales date (ambil YYYY-MM-DD jika order_date ada)
                if(order.order_date) {
                    let date = new Date(order.order_date).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
                    if(!salesByDate[date]) salesByDate[date] = 0;
                    salesByDate[date] += Number(order.total_price);
                }
            });

            // Render Sales Chart
            const salesCtx = document.getElementById('salesChart').getContext('2d');
            new Chart(salesCtx, {
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

            // Render Status Chart
            const statusCtx = document.getElementById('statusChart').getContext('2d');
            new Chart(statusCtx, {
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

    } catch (error) {

        console.error(
            "Gagal mengambil pesanan",
            error
        );

    }

}

// ==========================
// LOAD PRODUK
// ==========================

async function loadProduct() {

    try {

        const response =
            await fetch(
                `${API_ENDPOINT}/api/products`
            );

        const products =
            await response.json();

        let totalStock = 0;

        products.forEach(product => {

            totalStock += Number(
                product.stock
            );

        });

        document
        .getElementById("totalStock")
        .textContent =
        totalStock;

    } catch (error) {

        console.error(
            "Gagal mengambil stok",
            error
        );

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
            const allOrders = await response.json();
            
            const selectedMonth = parseInt(exportMonthSelect.value);
            const selectedYear = parseInt(exportYearInput.value);
            
            if (isNaN(selectedYear) || selectedYear < 2000 || selectedYear > 2100) {
                Swal.fire({
                    icon: 'error',
                    title: 'Tahun Tidak Valid',
                    text: 'Silakan masukkan tahun yang valid (2000 - 2100).'
                });
                return;
            }
            
            const namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
            const namaBulanBln = namaBulan[selectedMonth];
            
            const filteredOrders = allOrders.filter(order => {
                const dateValue = order.order_date || order.created_at || order.date;
                const orderDate = new Date(dateValue);
                return order.status.toLowerCase() === "selesai" && 
                       orderDate.getMonth() === selectedMonth && 
                       orderDate.getFullYear() === selectedYear;
            });
            
            if (filteredOrders.length === 0) {
                Swal.fire({
                    icon: 'info',
                    title: 'Data Kosong',
                    text: `Belum ada data penjualan pada bulan ${namaBulanBln} ${selectedYear}.`
                });
                return;
            }
            
            let totalPesanan = filteredOrders.length;
            let totalQty = 0;
            let totalPendapatan = 0;
            
            filteredOrders.forEach(order => {
                totalQty += Number(order.quantity);
                totalPendapatan += Number(order.total_price);
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
                const hargaSatuan = Number(order.total_price) / Number(order.quantity);
                aoa.push([
                    { v: index + 1, s: { border: getBorder() } },
                    { v: formatTanggal(dateValue), s: { border: getBorder() } },
                    { v: `ORD-${String(order.id).padStart(3, '0')}`, s: { border: getBorder() } },
                    { v: order.name || "-", s: { border: getBorder() } },
                    { v: order.product_name || "-", s: { border: getBorder() } },
                    { v: order.quantity, s: { border: getBorder() } },
                    { v: `Rp${hargaSatuan.toLocaleString('id-ID')}`, s: { border: getBorder() } },
                    { v: `Rp${Number(order.total_price).toLocaleString('id-ID')}`, s: { border: getBorder() } },
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
            const modalInstance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
            modalInstance.hide();
            
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: 'Laporan penjualan berhasil diunduh.'
            });
            
        } catch (error) {
            console.error("Gagal membuat report", error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Terjadi kesalahan saat membuat laporan.'
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
