import httpx

BASKET_BASE = "https://api.basket.com"  # placeholder; we will update once we confirm the live endpoint

HEADERS = {
    "User-Agent": "Basket/3.0.0 (iPhone; iOS 17.0)",
    "Accept": "application/json",
}

async def basket_search_raw(query: str, zip_code: str = "27576", limit: int = 10):
    """
    Raw search call to Basket's mobile endpoints.
    """
    url = f"{BASKET_BASE}/search"
    params = {
        "q": query,
        "zip": zip_code,
        "limit": limit
    }

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return {"data": []}

    return response.json()


async def basket_product_details(product_id: str, store_id: str):
    """
    Fetch price + availability for a specific product at a specific store.
    """
    url = f"{BASKET_BASE}/product/{product_id}"
    params = {"store_id": store_id}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=HEADERS, params=params)

    if response.status_code != 200:
        return None

    return response.json()
