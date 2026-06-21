import os
import httpx
from datetime import datetime, timedelta
from fastapi import HTTPException

from app.services.caching import cache_get, cache_set

# ---------------------------------------------------------
# TOKEN CONFIG
# ---------------------------------------------------------

kroger_token = {
    "access_token": None,
    "expires_at": None
}

KROGER_CLIENT_ID = os.getenv("KROGER_CLIENT_ID")
KROGER_CLIENT_SECRET = os.getenv("KROGER_CLIENT_SECRET")

TOKEN_URL = "https://api.kroger.com/v1/connect/oauth2/token"


# ---------------------------------------------------------
# TOKEN LOGIC
# ---------------------------------------------------------

async def get_kroger_token():
    """
    Retrieves and caches a Kroger OAuth token using Client Credentials flow.
    Refreshes automatically when expired.
    """
    if kroger_token["access_token"] and kroger_token["expires_at"] > datetime.utcnow():
        return kroger_token["access_token"]

    data = {
        "grant_type": "client_credentials",
        "scope": "product.compact"
    }

    auth = (KROGER_CLIENT_ID, KROGER_CLIENT_SECRET)

    async with httpx.AsyncClient() as client:
        response = await client.post(TOKEN_URL, data=data, auth=auth)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Kroger token request failed: {response.text}"
        )

    token_data = response.json()

    kroger_token["access_token"] = token_data["access_token"]
    kroger_token["expires_at"] = datetime.utcnow() + timedelta(seconds=token_data["expires_in"] - 30)

    return kroger_token["access_token"]


# ---------------------------------------------------------
# STORE LOOKUP
# ---------------------------------------------------------

async def fetch_kroger_stores(zip_code: str, radius: int):
    """
    Fetch Kroger stores near a ZIP code.
    Includes TTL caching.
    """
    cache_key = ("stores", zip_code, radius)
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await get_kroger_token()

    url = "https://api.kroger.com/v1/locations"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    params = {
        "filter.zipCode": zip_code,
        "filter.radiusInMiles": radius,
        "filter.limit": 10
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

    if response.status_code != 200:
        raise HTTPException(
            status_code=500,
            detail=f"Kroger store lookup failed: {response.text}"
        )

    data = response.json().get("data", [])

    cache_set(cache_key, data, ttl_seconds=1800)
    return data


# ---------------------------------------------------------
# HYBRID STORE RESOLUTION
# ---------------------------------------------------------

async def resolve_store_id(user_zip: str = "27576", radius: int = 35, override_store_id: str = None):
    """
    Hybrid store selection:
    1. If override_store_id is provided → use it.
    2. Else try user ZIP + radius.
    3. Else fallback to ZIP 27603.
    """
    if override_store_id:
        return override_store_id

    token = await get_kroger_token()
    url = "https://api.kroger.com/v1/locations"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }

    params = {
        "filter.zipCode": user_zip,
        "filter.radiusInMiles": radius,
        "filter.limit": 5
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json().get("data", [])
        if data:
            return data[0]["locationId"]

    params = {
        "filter.zipCode": "27603",
        "filter.limit": 5
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

    data = response.json().get("data", [])
    if not data:
        raise HTTPException(status_code=500, detail="No Kroger stores found even in fallback ZIP.")

    return data[0]["locationId"]


# ---------------------------------------------------------
# PRICE LOOKUP
# ---------------------------------------------------------

async def get_kroger_price(product_id: str, store_id: str):
    """
    Fetch price for a product at a specific Kroger store.
    Includes TTL caching.
    """
    cache_key = ("price", product_id, store_id)
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await get_kroger_token()

    url = f"https://api.kroger.com/v1/products/{product_id}/locations"
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/json"
    }
    params = {
        "filter.locationId": store_id
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, params=params)

    if response.status_code != 200:
        result = {
            "regular_price": None,
            "sale_price": None,
            "price_per_unit": None
        }
        cache_set(cache_key, result, ttl_seconds=600)
        return result

    data = response.json().get("data", [])
    if not data:
        result = {
            "regular_price": None,
            "sale_price": None,
            "price_per_unit": None
        }
        cache_set(cache_key, result, ttl_seconds=600)
        return result

    price_info = data[0].get("price", {})

    result = {
        "regular_price": price_info.get("regular"),
        "sale_price": price_info.get("promo"),
        "price_per_unit": price_info.get("regular")
    }

    cache_set(cache_key, result, ttl_seconds=600)
    return result


# ---------------------------------------------------------
# NUTRITION PREVIEW
# ---------------------------------------------------------

def extract_nutrition_preview(raw):
    """
    Extract only the nutrition fields needed for recipe math.
    """
    info = raw.get("nutritionInformation", [])
    if not info:
        return {}

    nutrients = info[0].get("nutrients", [])

    def get_nutrient(code):
        for n in nutrients:
            if n.get("code") == code:
                return n.get("quantity")
        return None

    return {
        "calories": get_nutrient("ENER-"),
        "protein_g": get_nutrient("PRO-"),
        "fat_g": get_nutrient("FAT"),
        "carbs_g": get_nutrient("CHO-")
    }


# ---------------------------------------------------------
# PRODUCT NORMALIZATION
# ---------------------------------------------------------

def normalize_kroger_product(raw, price_data, nutrition_preview):
    # Best image
    image_url = None
    for img in raw.get("images", []):
        if img.get("perspective") == "front":
            for size in img.get("sizes", []):
                if size.get("size") == "large":
                    image_url = size.get("url")
                    break
            if image_url:
                break

    if not image_url and raw.get("images"):
        image_url = raw["images"][0]["sizes"][0]["url"]

    size = None
    if raw.get("items"):
        size = raw["items"][0].get("size")

    return {
        "product_id": raw.get("productId"),
        "upc": raw.get("upc"),
        "name": raw.get("description"),
        "brand": raw.get("brand"),
        "size": size,
        "categories": raw.get("categories", []),
        "image_url": image_url,
        "description": raw.get("description"),

        "regular_price": price_data.get("regular_price"),
        "sale_price": price_data.get("sale_price"),
        "price_per_unit": price_data.get("price_per_unit"),

        "nutrition_preview": nutrition_preview,
    }
