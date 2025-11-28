from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import HTTPException
import gspread
from oauth2client.service_account import ServiceAccountCredentials
import pandas as pd
import re
import json

app = FastAPI()

df = None  # variabel global

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_google_sheet_data():
    # Definisikan scope (izin akses)
    scope = [
        "https://spreadsheets.google.com/feeds",
        "https://www.googleapis.com/auth/drive"
    ]
    
    # Load credentials dari file JSON
    creds = ServiceAccountCredentials.from_json_keyfile_name("credentials.json", scope)
    client = gspread.authorize(creds)

    with open("credentials.json") as f:
        data_json = json.load(f)
    
    url_sheet = data_json.get("spreadsheet_url") # Ambil URL yang tadi kita simpan

    # 3. Buka Sheet menggunakan URL tersebut
    sh = client.open_by_url(url_sheet)
    sheet = sh.worksheet("PM dashboard")

    data = sheet.get_all_records()
    return data

# FUngsi extract data bulan 
def extract_month(value):
    value = str(value)

    # Coba format baru: YYYY_MM_NAMABULAN
    match = re.search(r'^\d{4}_(\d{1,2})_', value)
    if match:
        return int(match.group(1))

    # Coba format lama (jika ada format lain)
    match = re.search(r'(\d{1,2})', value)
    if match:
        return int(match.group(1))
    
    return None

# Get data 
def get_dataset():
    global df
    try:
        raw_data = get_google_sheet_data()

        if raw_data is None:
            raise Exception("Google Sheet mengembalikan data kosong")

        df = pd.DataFrame(raw_data)

        if df.empty:
            raise Exception("Dataset kosong")

        return df

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset error: {str(e)}")


# GLobal 
@app.get("/")
def home():
    return {"status": "Backend is running"}

# Data
@app.get("/api/data")
def read_data():
    df = get_dataset()
    if df is None:
        return {"status": "error", "message": "Dataset not loaded"}

    return {
        "status": "success",
        "total_rows": len(df),
        "data": df.to_dict(orient="records")
    }

# Data berdasarkan tahun
@app.get("/api/data/{tahun}")
async def get_data_by_year(tahun: int):
    df = get_dataset()

    if " Tahun" not in df.columns:
        raise HTTPException(status_code=500, detail="Kolom 'Tahun' tidak ada pada dataset")

    df_filtered = df[df[" Tahun"] == tahun]

    return {
        "status": "success",
        "filter_tahun": tahun,
        "total_data": len(df_filtered),
        "data": df_filtered.to_dict(orient="records"),
    }


# Data berdasarkan bulan
@app.get("/api/data/{tahun}/{bulan}")
async def total_project_per_bulan(tahun: int, bulan: int):
    df = get_dataset()

    if " Bulan Target Close" not in df.columns:
        raise HTTPException(status_code=500, detail="Kolom 'Bulan Target Close' tidak ada pada dataset")

    df["Bulan_Numeric"] = df[" Bulan Target Close"].apply(extract_month)

    df_filtered = df[
        (df[" Tahun"] == tahun) &
        (df["Bulan_Numeric"] == bulan)
    ]

    return {
        "status": "success",
        "tahun": tahun,
        "bulan": bulan,
        "total_project": len(df_filtered),
        "data": df_filtered.to_dict(orient="records")
    }