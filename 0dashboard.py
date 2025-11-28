import streamlit as st
import pandas as pd
import requests

st.set_page_config(page_title="Test1", layout="wide")
st.title("🌐 Dashboard via API Backend")

# URL Backend Anda (FastAPI default port 8000)
API_URL = "http://localhost:8000/api/data"

if st.button("🔄 Refresh Data"):
    st.cache_data.clear()
    st.rerun()

@st.cache_data(ttl=60) 
def fetch_data_from_api():
    try:
        response = requests.get(API_URL)
        if response.status_code == 200:
            result = response.json()
            if result['status'] == 'success':
                return pd.DataFrame(result['data'])
            else:
                st.error(f"Backend Error: {result['message']}")
                return pd.DataFrame()
        else:
            st.error("Gagal menghubungi server backend.")
            return pd.DataFrame()
    except Exception as e:
        st.error(f"Koneksi Refused: Pastikan backend.py sudah dijalankan! Error: {e}")
        return pd.DataFrame()

# Load Data
df = fetch_data_from_api()

if not df.empty:
    st.success("✅ Data berhasil diambil dari API")
    st.dataframe(df, use_container_width=True)
    st.bar_chart(df.select_dtypes(include=['number'])) # Plot kolom angka otomatis