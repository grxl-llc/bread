import httpx
from fastapi import HTTPException

from app.integrations.kroger import (
    resolve_store_id,
    get_kroger_token,
    get_kroger_price,
    extract_nutrition_preview,
    normalize_kroger_product
)

from app.services.caching import cache_get, cache_set


async def search_products_service(query: str, limit: int, store_id: str, user_zip: str, radius: int):
    """
    Core Kroger search engine.
    Extracted from router for reuse and clarity.
    """

    # 1. Resolve store ID
    resolved_store_id = await resolve_store_id(
        user_zip=user_zip,
        radius=radius,
        override_store_id=store_id
    )

    # 2. Check cache
    cache_key = ("search", query, limit)
    cached = cache_get(cache_key)

    if cached:
        raw_products = cached
    else:
        # Fetch products from Kroger
        token = await get_kroger_token()
        url = "https://api.kroger.com/v1/products"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        params = {"filter.term": query, "filter.limit": limit}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params)

        if response.status_code != 200:
            raise HTTPException(500, f"Kroger search failed: {response.text}")

        raw_products = response.json().get("data", [])

        # Cache for 5 minutes
        cache_set(cache_key, raw_products, ttl_seconds=300)

    # 3. Normalize results
    results = []
    for raw in raw_products:
        product_id = raw.get("productId")
        price_data = await get_kroger_price(product_id, resolved_store_id)
        nutrition_preview = extract_nutrition_preview(raw)

        normalized = normalize_kroger_product(
            raw=raw,
            price_data=price_data,
            nutrition_preview=nutrition_preview
        )

        results.append(normalized)

    return {
        "store_id": resolved_store_id,
        "results": results
    }
