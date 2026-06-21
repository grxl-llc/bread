import requests

BASE_URL = "http://127.0.0.1:8000"

def get_stores(zip_code: str):
    response = requests.get(f"{BASE_URL}/stores/by-zip/{zip_code}")
    return response.json()

def get_ingredients():
    response = requests.get(f"{BASE_URL}/ingredients")
    return response.json()

def get_products_for_ingredient(ingredient_id: int):
    response = requests.get(f"{BASE_URL}/products/by-ingredient/{ingredient_id}")
    return response.json()
