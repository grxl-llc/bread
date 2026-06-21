import httpx
from fastapi import HTTPException

from app.integrations.kroger import (
    resolve_store_id,
    get_kroger_token,
    get_kroger_price,
    extract_nutrition_preview,
    normalize_kroger_product
)

from app.services.unit_normalization import (
    parse_size,
    normalize_unit,
    calculate_price_per_unit
)


async def calculate_recipe_cost_service(payload: dict):
    """
    Core recipe cost engine.
    Extracted from router for reuse by adapters and comparison engine.
    """

    ingredients = payload.get("ingredients", [])
    store_id = payload.get("store_id")
    user_zip = payload.get("user_zip", "27576")
    radius = payload.get("radius", 35)
    pantry_names = [p.lower().strip() for p in (payload.get("pantry_names") or []) if p]

    # 1. Resolve store
    resolved_store_id = await resolve_store_id(
        user_zip=user_zip,
        radius=radius,
        override_store_id=store_id
    )

    results = []
    already_have = []
    total_cost = 0

    def _in_pantry(ingredient_name: str) -> bool:
        n = ingredient_name.lower().strip()
        return any(len(pn) > 2 and (n in pn or pn in n) for pn in pantry_names)

    def _cost_to_fulfill(product, needed_amount: float):
        """
        Cost to BUY ENOUGH of this product to satisfy the recipe.
        For a tiny need (e.g. 1 tbsp), almost any package = 1 unit, so this
        reduces to the cheapest absolute package price — exactly the intent:
        buy the cheapest small jar, not the lowest price-per-ounce economy size.
        Returns (packages_needed, package_price, total_cost).
        """
        package_price = product.get("sale_price") or product.get("regular_price")
        unit_amount = product.get("unit_amount")
        if not package_price:
            return 1, None, float("inf")
        if not unit_amount or unit_amount <= 0:
            packages = 1  # unknown size → assume one package covers it
        else:
            raw = needed_amount / unit_amount
            packages = max(int(raw) + (1 if raw % 1 > 0 else 0), 1)
        return packages, package_price, packages * package_price

    # 2. Process each ingredient
    for ing in ingredients:
        name = ing["name"]
        needed_amount = ing.get("amount", 1) or 1
        needed_unit = ing.get("unit", "")
        chosen_product_id = ing.get("product_id")

        # Already owned → goes to "already have", excluded from cost.
        if _in_pantry(name):
            already_have.append({
                "name": name, "needed_amount": needed_amount, "needed_unit": needed_unit,
            })
            continue

        # A. Search Kroger for matching products
        token = await get_kroger_token()
        url = "https://api.kroger.com/v1/products"
        headers = {"Authorization": f"Bearer {token}", "Accept": "application/json"}
        params = {"filter.term": name, "filter.limit": 8}

        async with httpx.AsyncClient() as client:
            response = await client.get(url, headers=headers, params=params)

        raw_products = response.json().get("data", [])

        if not raw_products:
            results.append({"name": name, "error": "No matching products found"})
            continue

        # B. Normalize + price every candidate
        candidates = []
        for raw in raw_products:
            product_id = raw.get("productId")
            price_data = await get_kroger_price(product_id, resolved_store_id)
            nutrition_preview = extract_nutrition_preview(raw)
            normalized = normalize_kroger_product(
                raw=raw, price_data=price_data, nutrition_preview=nutrition_preview
            )
            if normalized.get("sale_price") or normalized.get("regular_price"):
                packages, _unit_price, fulfill = _cost_to_fulfill(normalized, needed_amount)
                normalized["packages_needed"] = packages
                normalized["cost"] = round(fulfill, 2)
                normalized["product_id"] = product_id
                candidates.append(normalized)

        if not candidates:
            results.append({"name": name, "error": "No priced products found"})
            continue

        # C. Selection — all prices are LIVE (current sale reflected):
        #    • If the user chose a specific brand, re-price THAT product now.
        #    • Otherwise pick the cheapest total package to fulfill the need.
        candidates.sort(key=lambda p: p["cost"])
        best = None
        if chosen_product_id:
            best = next((c for c in candidates if c.get("product_id") == chosen_product_id), None)
        if best is None:
            best = candidates[0]
        total_cost += best["cost"]

        results.append({
            "name": name,
            "needed_amount": needed_amount,
            "needed_unit": needed_unit,
            "product": best,
            "packages_needed": best["packages_needed"],
            "cost": best["cost"],
            # Brand alternatives for the "click to see brands" view (cheapest first)
            "alternatives": candidates[:6],
        })

    return {
        "store_id": resolved_store_id,
        "total_cost": round(total_cost, 2),
        "ingredients": results,
        "already_have": already_have,
    }
