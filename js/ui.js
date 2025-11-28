const UI = {

    // Cahrt
    charts: {
        bar: null,
        pie1: null,
        pie2: null
    },

    // --- STATE PAGINATION ---
    state: {
        currentPage: 1,
        rowsPerPage: 6,
        currentData: [] // Menyimpan data hasil filter saat ini
    },
    
    // 1. Format Rupiah
    formatRupiah: (number) => {
        return new Intl.NumberFormat('id-ID', { 
            style: 'currency', 
            currency: 'IDR',
            minimumFractionDigits: 0 
        }).format(number);
    },

    // 2. Tampilkan Loading
    showLoading: () => {
        // Cek 1: Apakah kita di Halaman Utama (Ada Tabel)?
        const tb = document.getElementById('tableBody');
        if (tb) {
            tb.innerHTML = `<tr><td colspan="8" class="text-center py-12"><div class="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600 mx-auto mb-4"></div><p class="text-gray-500 animate-pulse">Memuat data...</p></td></tr>`;
            // Sembunyikan pagination kalau ada
            const pag = document.getElementById('paginationContainer');
            if(pag) pag.innerHTML = '';
        }

        // Cek 2: Apakah kita di Halaman Analytics (Ada Loader)?
        const loader = document.getElementById('analyticsLoader');
        const content = document.getElementById('analyticsContent');
        
        if (loader && content) {
            // Tampilkan Loader, Sembunyikan Grafik
            loader.classList.remove('hidden');
            loader.classList.add('flex'); // Agar centering jalan
            content.classList.add('hidden');
        }
    },

    // 3. Tampilkan Pesan Error/Kosong
    showEmpty: (message) => {
        const tableBody = document.getElementById('tableBody');
        if(tableBody) {
            tableBody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-gray-400">${message}</td></tr>`;
        }
    },

    // HELPER PENTING: Untuk filter lokal (mengubah data "Januari" jadi angka 1)
    getMonthNumber: (monthName) => {
        if (!monthName) return 0;
        const months = [
            "januari", "februari", "maret", "april", "mei", "juni",
            "juli", "agustus", "september", "oktober", "november", "desember"
        ];
        const index = months.indexOf(String(monthName).toLowerCase().trim());
        return index === -1 ? 0 : index + 1;
    },

    // 4. Update Dropdown (HANYA TAHUN & WITEL)
    populateDropdowns: (data) => {
        const tahunSelect = document.getElementById("filterTahun");
        const witelSelect = document.getElementById("filterWitel");
        
        // KITA TIDAK MENYENTUH filterBulan KARENA SUDAH DI HARDCODE DI HTML

        // Ambil Data Unik
        const yearsSet = [...new Set(data.map(item => item[" Tahun"]).filter(Boolean))];
        const witelSet = [...new Set(data.map(item => item["NEW_WITEL"]).filter(Boolean))];

        // Sorting
        yearsSet.sort().reverse(); // Tahun terbaru diatas
        witelSet.sort(); // Witel abjad

        // Render Tahun
        tahunSelect.innerHTML = `<option value="">Semua Tahun</option>`;
        yearsSet.forEach(t => {
            tahunSelect.innerHTML += `<option value="${t}">${t}</option>`;
        });

        // Render Witel
        witelSelect.innerHTML = `<option value="">Semua Witel</option>`;
        witelSet.forEach(w => {
            witelSelect.innerHTML += `<option value="${w}">${w}</option>`;
        });

        // Auto Select 2023
        if (yearsSet.includes("2023") || yearsSet.includes(2023)) {
            tahunSelect.value = "2023";
        }
    },

    // 5. Update Cards Statistik
    updateCards: (data) => {
        const elTotal = document.getElementById("totalProject");
        if (!elTotal) return;

        let totalBC = 0;
        let selesai = 0;

        data.forEach(row => {
            totalBC += parseFloat(row[" Nilai BC"]) || 0;
            const status = parseInt(row[" PROGRESS DOKUMEN"]);
            if (status === 6) selesai++;
        });

        document.getElementById("totalProject").innerText = data.length;
        document.getElementById("totalNilaiBC").innerText = UI.formatRupiah(totalBC);
        document.getElementById("projectSelesai").innerText = selesai;
    },

    // 6. Update Table
    updateTable: (data) => {
        const tb = document.getElementById("tableBody");
        if (!tb) return;

        // 1. Simpan data baru ke state
        UI.state.currentData = data;
        // 2. Reset ke halaman 1
        UI.state.currentPage = 1;
        // 3. Render Baris & Tombol
        UI.renderRows();
        UI.renderPagination();
    },

    // Render tiap rows
    renderRows: () => {
        const { currentPage, rowsPerPage, currentData } = UI.state;
        const tbody = document.getElementById("tableBody");
        tbody.innerHTML = "";

        if (!currentData.length) return UI.showEmpty("Data tidak ditemukan.");

        // HITUNG SLICE (POTONG DATA)
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedData = currentData.slice(startIndex, endIndex);

        const frag = document.createDocumentFragment();
        paginatedData.forEach(r => {
            const tr = document.createElement("tr");
            tr.className = "border-b hover:bg-gray-50 transition-colors";
            
            let p = r[" PROGRESS DOKUMEN"];
            let cls = "bg-gray-100 text-gray-600";
            if(['6','100%'].includes(String(p))) cls = "bg-green-100 text-green-700";
            else if(parseInt(p)>3) cls = "bg-blue-100 text-blue-700";
            else cls = "bg-yellow-100 text-yellow-700";

            tr.innerHTML = `
                <td class="p-3 font-medium text-gray-900">${r["ID_PM"]||'-'}</td>
                <td class="p-3 text-sm">${r[" NAMA PELANGGAN"]||'-'}</td>
                <td class="p-3 text-sm text-center">${r[" Tahun"]}</td>
                <td class="p-3 text-sm text-center">${r[" Bulan Target Close"]}</td>
                <td class="p-3 text-sm">${r["NEW_WITEL"]}</td>
                <td class="p-3 text-sm max-w-xs truncate" title="${r[" JUDUL KB"]}">${r[" JUDUL KB"]||'-'}</td>
                <td class="p-3 text-right font-mono text-xs">${UI.formatRupiah(r[" Nilai BC"]||0)}</td>
                <td class="p-3 text-center"><span class="px-2 py-1 rounded text-xs font-bold ${cls}">${p}</span></td>
            `;
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
    },

    // Fungsi Internal: Render Tombol Prev/Next
    renderPagination: () => {
        const { currentPage, rowsPerPage, currentData } = UI.state;
        const container = document.getElementById("paginationContainer");
        const totalPages = Math.ceil(currentData.length / rowsPerPage);

        // Jika data kosong, sembunyikan pagination
        if (currentData.length === 0) {
            container.innerHTML = "";
            return;
        }

        // Hitung info "Showing X to Y of Z"
        const startItem = (currentPage - 1) * rowsPerPage + 1;
        const endItem = Math.min(currentPage * rowsPerPage, currentData.length);

        container.innerHTML = `
            <div class="text-sm text-gray-500 m-2">
                Menampilkan <span class="font-medium text-gray-800">${startItem}</span> - <span class="font-medium text-gray-800">${endItem}</span> 
                dari <span class="font-medium text-gray-800">${currentData.length}</span> data
            </div>

            <div class="flex gap-2 m-2">
                <button onclick="UI.changePage(${currentPage - 1})" 
                    ${currentPage === 1 ? 'disabled' : ''}
                    class="px-3 py-1 border rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Prev
                </button>
                
                <span class="px-3 py-1 bg-gray-100 rounded text-sm font-bold text-gray-700 border">
                    ${currentPage}
                </span>

                <button onclick="UI.changePage(${currentPage + 1})" 
                    ${currentPage === totalPages ? 'disabled' : ''}
                    class="px-3 py-1 border rounded bg-white text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition">
                    Next
                </button>
            </div>
        `;
    },

    // Fungsi Ganti Halaman (Dipanggil tombol Next/Prev)
    changePage: (newPage) => {
        UI.state.currentPage = newPage;
        UI.renderRows();      // Render ulang baris
        UI.renderPagination(); // Render ulang tombol (update disable state)
    },

    renderCharts: (data) => {
        // 1. AMBIL KETIGA ELEMENT CANVAS
        const ctxBar = document.getElementById('barChartRevenue');
        const ctxPie1 = document.getElementById('pieChartBast');
        const ctxPie2 = document.getElementById('pieChartStatus');

        // Safety Check: Jika salah satu tidak ada (misal di halaman dashboard), berhenti.
        if (!ctxBar || !ctxPie1 || !ctxPie2) return; 

        // 2. MATIKAN LOADING SCREEN (Karena elemen chart ditemukan)
        const loader = document.getElementById('analyticsLoader');
        const content = document.getElementById('analyticsContent');
        if (loader && content) {
            loader.classList.add('hidden');
            loader.classList.remove('flex');
            content.classList.remove('hidden');
        }

        // B. OLAH DATA (Data Processing)

        // 1. Data untuk Bar Chart (Revenue per Customer Group)
        // Kita simulasi grouping berdasarkan nama pelanggan
        let groups = { "DGS": 0, "DPS (PRIVATE)": 0, "DSS (SOE)": 0, "DBS": 0 };
        
        data.forEach(d => {
            const val = parseFloat(d[" Nilai BC"]) || 0;
            const nama = (d[" BUD"] || "").toUpperCase();
            
            if (nama === "DGS") {
                groups["DGS"] += val;
            } else if (nama === "DPS (PRIVATE)") {
                groups["DPS (PRIVATE)"] += val;
            } else if (nama === "DSS (SOE)") {
                groups["DSS (SOE)"] += val;
            } else {
                groups["DBS"] += val;
            }
        });

        // 2. Data untuk Pie Chart 1 (BAST vs BAPLA)
        let bast = 0, bapla = 0;
        data.forEach(d => {
            const judul = (d[" TIPE DOKUMEN (BAST/BAPLA)"] || "").toUpperCase();
            if (judul.includes("BAPLA")) bapla++;
            else bast++;
        });

        // 3. Data untuk Pie Chart 2 (Status: PROVCOMP vs BILCOMP)
        let prov = 0, bil = 0;
        data.forEach(d => {
            // Asumsi: Progress > 3 adalah BILCOMP (Billing Complete), sisanya Provisioning
            const prog = parseInt(d[" PROGRESS DOKUMEN"]) || 0;
            if (prog === 6) bil++;
            else prov++;
        });

        // C. RENDER CHART.JS
        
        // Helper: Hapus chart lama jika ada (agar tidak numpuk/glitch)
        const destroy = (key) => { if(UI.charts[key]) UI.charts[key].destroy(); };

        // --- 1. RENDER BAR CHART ---
        destroy('bar');
        UI.charts.bar = new Chart(ctxBar, {
            type: 'bar',
            data: {
                labels: Object.keys(groups),
                datasets: [{
                    label: 'Total Revenue (Rp)',
                    data: Object.values(groups),
                    backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#6b7280'], // Warna-warni
                    borderRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { 
                    y: { 
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) { return 'Rp ' + (value/1000000).toFixed(0) + ' Jt'; }
                        }
                    } 
                }
            }
        });

        // --- 2. RENDER PIE CHART (BAST) ---
        destroy('pie1');
        UI.charts.pie1 = new Chart(ctxPie1, {
            type: 'doughnut', // Doughnut lebih modern dari Pie biasa
            data: {
                labels: ['BAST', 'BAPLA'],
                datasets: [{
                    data: [bast, bapla],
                    backgroundColor: ['#2563eb', '#0d9488'],
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });

        // --- 3. RENDER PIE CHART (STATUS) ---
        destroy('pie2');
        UI.charts.pie2 = new Chart(ctxPie2, {
            type: 'doughnut',
            data: {
                labels: ['PROVCOMP', 'BILCOMP'],
                datasets: [{
                    data: [prov, bil],
                    backgroundColor: ['#8b5cf6', '#ec4899'], // Ungu & Pink
                    borderWidth: 0
                }]
            },
            options: { responsive: true, maintainAspectRatio: false }
        });
    }
};

window.UI = UI;