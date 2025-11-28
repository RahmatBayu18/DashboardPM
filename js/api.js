const API_BASE = "http://127.0.0.1:8000/api/data";

window.API = {
    // 1. GET Semua Data
    fetchAllData: async () => {
        const res = await fetch(`${API_BASE}`);
        if (!res.ok) throw new Error("Gagal fetch data");
        return await res.json();
    },

    // 2. GET by Tahun (Server Side)
    fetchDataByYear: async (tahun) => {
        const res = await fetch(`${API_BASE}/${tahun}`);
        if (!res.ok) throw new Error("Gagal fetch data tahun");
        return await res.json();
    },

    // 3. GET by Tahun & Bulan (Server Side)
    fetchDataByMonth: async (tahun, bulan) => {
        const res = await fetch(`${API_BASE}/${tahun}/${bulan}`);
        if (!res.ok) throw new Error("Gagal fetch data bulan");
        return await res.json();
    }
};