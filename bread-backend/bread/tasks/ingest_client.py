import requests

BASE_URL = "http://127.0.0.1:8000"

def ingest_price(payload: dict):
    url = f"{BASE_URL}/pricing/ingest"
    try:
        response = requests.post(url, json=payload)
        print("Ingest response:", response.status_code, response.text)
    except Exception as e:
        print("Ingest failed:", e)
