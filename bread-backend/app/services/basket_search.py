from app.integrations.basket import basket_search_raw, basket_product_details
from app.adapters.basket_adapter import normalize_basket_product

async def basket_search_service(query: str, zip_code: str = "27576", limit: int = 10):
    raw = await basket_search_raw(query, zip_code, limit)
    products = raw.get("data", [])

    normalized = []
    for p in products:
        normalized.append(normalize_basket_product(p))

    return {"products": normalized}


async def basket_price_service(product_id: str, store_id: str):
    raw = await basket_product_details(product_id, store_id)
    if not raw:
        return None

    return normalize_basket_product(raw)
