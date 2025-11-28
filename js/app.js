// Variable Global
let globalData = [];

// --- FUNGSI FILTER UTAMA ---
async function applyFilters(isInitialLoad = false) {
    window.UI.showLoading();

    // 1. Ambil Value dari Input
    const tahun = document.getElementById("filterTahun").value;
    const witel = document.getElementById("filterWitel").value;
    const bulan = document.getElementById("filterBulan") ? document.getElementById("filterBulan").value : "";

    try {
        let filteredData;

        // --- STEP A: REQUEST KE SERVER (API) ---
        if (tahun && bulan) {
            // API Menerima (Tahun: 2023, Bulan: 1) -> Cocok!
            console.log(`Mengambil data server: Tahun ${tahun}, Bulan ${bulan}`);
            const response = await window.API.fetchDataByMonth(tahun, bulan);
            filteredData = response.data || response;

        } else if (tahun) {
            // API Tahunan
            console.log(`Mengambil data server: Tahun ${tahun}`);
            const response = await window.API.fetchDataByYear(tahun);
            filteredData = response.data || response;

        } else {
            // Data Global
            console.log("Menggunakan data global cache");
            filteredData = [...globalData];
        }

        // --- STEP B: FILTER LOKAL (WITEL & Fallback Bulan) ---
        
        // 1. Filter Witel
        if (witel) {
            filteredData = filteredData.filter(d => (d["NEW_WITEL"] || "").trim() === witel.trim());
        }

        // 2. Filter Bulan (Fallback)
        if (bulan && !tahun) {
            filteredData = filteredData.filter(d => {
                const angkaBulanData = window.UI.getMonthNumber(d[" Bulan Target Close"]);
                return String(angkaBulanData) === String(bulan);
            });
        }

        // --- STEP C: UPDATE UI ---
        if (!Array.isArray(filteredData)) filteredData = [];
        
        window.UI.renderCharts(filteredData);
        window.UI.updateCards(filteredData);
        window.UI.updateTable(filteredData);

    } catch (error) {
        console.error("Error Filtering:", error);
        window.UI.showEmpty("Gagal mengambil data filter.");
    }
}

// --- FUNGSI INIT ---
async function initApp() {
    window.UI.showLoading();

    try {
        console.log("Fetching initial data...");
        const result = await window.API.fetchAllData();
        
        globalData = result.data || result;
        if (!Array.isArray(globalData)) globalData = [];

        // Isi Dropdown (Hanya Tahun & Witel yang dinamis)
        window.UI.populateDropdowns(globalData);

        // Event Listeners
        document.getElementById("filterTahun").addEventListener("change", () => applyFilters());
        document.getElementById("filterWitel").addEventListener("change", () => applyFilters());
        
        // Event Listener Bulan
        const elBulan = document.getElementById("filterBulan");
        if(elBulan) elBulan.addEventListener("change", () => applyFilters());

        // Jalankan Filter Pertama Kali
        applyFilters(true);

    } catch (error) {
        console.error(error);
        window.UI.showEmpty("Gagal mengambil data dari server.");
    }
}

document.addEventListener('DOMContentLoaded', initApp);