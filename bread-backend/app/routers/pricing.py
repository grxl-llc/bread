"""
Grocery pricing routes — Kroger live search + price comparison.
"""
import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.config import settings
from app.services.caching import cache_get, cache_set

router = APIRouter(prefix="/pricing", tags=["pricing"])

KROGER_TOKEN_URL = "https://api.kroger.com/v1/connect/oauth2/token"
KROGER_PRODUCTS_URL = "https://api.kroger.com/v1/products"
KROGER_LOCATIONS_URL = "https://api.kroger.com/v1/locations"


async def get_kroger_token() -> str:
    cached = cache_get("kroger_token")
    if cached:
        return cached

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            KROGER_TOKEN_URL,
            data={"grant_type": "client_credentials", "scope": "product.compact"},
            auth=(settings.kroger_client_id, settings.kroger_client_secret),
        )
        resp.raise_for_status()
        data = resp.json()

    token = data["access_token"]
    expires_in = data.get("expires_in", 1800) - 60  # 1 min buffer
    cache_set("kroger_token", token, ttl_seconds=expires_in)
    return token


MAX_STORE_RADIUS_MILES = 50  # beyond this we say "no local store" rather than silently using a distant one

async def get_kroger_store(zip_code: str) -> dict | None:
    """
    Returns {"store_id", "store_name", "store_chain", "distance_miles"} for
    the nearest Kroger-family store within MAX_STORE_RADIUS_MILES.
    Returns None if no store is within range.
    Caches 24 h — store assignments don't change often.
    """
    cache_key = f"kroger_store_v2_{zip_code}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await get_kroger_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            KROGER_LOCATIONS_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "filter.zipCode.near": zip_code,
                "filter.radiusInMiles": MAX_STORE_RADIUS_MILES,
                "filter.limit": 1,
            },
        )
        resp.raise_for_status()
        data = resp.json()

    if not data.get("data"):
        cache_set(cache_key, None, ttl_seconds=3600)
        return None

    loc = data["data"][0]
    # Kroger API returns geolocation; distance isn't a direct field but chain name is.
    chain_raw = (loc.get("chain") or "KROGER").upper()
    # Map chain codes to friendly display names
    CHAIN_NAMES = {
        "KROGER": "Kroger", "HARRIS_TEETER": "Harris Teeter",
        "FRED_MEYER": "Fred Meyer", "RALPHS": "Ralphs",
        "KING_SOOPERS": "King Soopers", "CITY_MARKET": "City Market",
        "SMITHS": "Smith's", "FRYS": "Fry's", "QFC": "QFC",
        "MARIANOS": "Mariano's", "PICK_N_SAVE": "Pick 'n Save",
        "METRO_MARKET": "Metro Market", "COPPS": "Copps",
        "DILLONS": "Dillons", "BAKERS": "Baker's",
        "GERBES": "Gerbes", "OWEN": "Owen's",
        "PAY_LESS": "Pay Less",
    }
    store_name = loc.get("name") or CHAIN_NAMES.get(chain_raw, chain_raw.title())
    chain_display = CHAIN_NAMES.get(chain_raw, chain_raw.title())

    result = {
        "store_id": loc["locationId"],
        "store_name": store_name,
        "store_chain": chain_display,
    }
    cache_set(cache_key, result, ttl_seconds=86400)
    return result


# Backward-compat shim used internally by search_prices
async def get_kroger_store_id(zip_code: str) -> str | None:
    store = await get_kroger_store(zip_code)
    return store["store_id"] if store else None


@router.get("/search")
async def search_prices(
    query: str = Query(..., min_length=1),
    zip_code: str = Query(..., min_length=5),
    limit: int = Query(10, le=50),
    current_user: User = Depends(get_current_user),
):
    """
    Search Kroger for product prices by ingredient name.
    Returns normalized product list with prices.
    """
    if not settings.kroger_client_id or not settings.kroger_client_secret:
        raise HTTPException(503, "Kroger API not configured")

    store_id = await get_kroger_store_id(zip_code)
    if not store_id:
        raise HTTPException(status_code=404, detail=f"No Kroger stores found near {zip_code}")

    cache_key = f"kroger_search_{query}_{store_id}_{limit}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await get_kroger_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            KROGER_PRODUCTS_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "filter.term": query,
                "filter.locationId": store_id,
                "filter.limit": limit,
            },
        )
        resp.raise_for_status()
        raw = resp.json()

    # Get the real chain name for this store
    store_info = await get_kroger_store(zip_code)
    chain_label = store_info["store_chain"] if store_info else "Kroger"

    results = []
    for item in raw.get("data", []):
        price_info = item.get("items", [{}])[0] if item.get("items") else {}
        price = None
        sale_price = None
        if price_info.get("price"):
            price = price_info["price"].get("regular")
            sale_price = price_info["price"].get("promo") or None

        results.append({
            "product_id": item.get("productId"),
            "name": item.get("description", ""),
            "brand": item.get("brand", ""),
            "size": price_info.get("size", ""),
            "price": price,
            "sale_price": sale_price,
            "image_url": (item.get("images") or [{}])[0].get("sizes", [{}])[-1].get("url"),
            "store": chain_label,
            "store_id": store_id,
            "zip_code": zip_code,
        })

    cache_set(cache_key, results, ttl_seconds=300)
    return results


@router.get("/compare")
async def compare_prices(
    items: str = Query(..., description="Comma-separated ingredient names"),
    zip_code: str = Query(..., min_length=5),
    current_user: User = Depends(get_current_user),
):
    """
    Get the best price for each ingredient from Kroger.
    Returns {ingredient: best_product} map.
    """
    ingredient_list = [i.strip() for i in items.split(",") if i.strip()]
    comparison = {}

    for ingredient in ingredient_list:
        results = await search_prices(
            query=ingredient,
            zip_code=zip_code,
            limit=5,
            current_user=current_user,
        )
        if results:
            # Pick cheapest non-null price
            priced = [r for r in results if r["price"] is not None]
            if priced:
                comparison[ingredient] = min(priced, key=lambda r: r["sale_price"] or r["price"])
            else:
                comparison[ingredient] = results[0]

    return comparison


async def _fetch_products_by_id(product_ids, store_id):
    """Fetch exact products by Kroger productId at a store — used to re-price the
    user's chosen brand directly (their stored ingredient 'name' is often the
    full marketing string, which doesn't search well)."""
    if not product_ids:
        return []
    token = await get_kroger_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            KROGER_PRODUCTS_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={"filter.productId": ",".join(product_ids), "filter.locationId": store_id},
        )
        if resp.status_code != 200:
            return []
        raw = resp.json()

    out = []
    for item in raw.get("data", []):
        pinfo = item.get("items", [{}])[0] if item.get("items") else {}
        price_obj = pinfo.get("price") or {}
        out.append({
            "product_id": item.get("productId"),
            "name": item.get("description", ""),
            "brand": item.get("brand", ""),
            "size": pinfo.get("size", ""),
            "price": price_obj.get("regular"),
            "sale_price": price_obj.get("promo") or None,
            "image_url": (item.get("images") or [{}])[0].get("sizes", [{}])[-1].get("url"),
            "store": "Kroger",
        })
    return out


@router.post("/recipe-cost")
async def recipe_cost(
    payload: dict,
    current_user: User = Depends(get_current_user),
):
    """
    LIVE recipe cost on the proven search path (same source as the autocomplete
    and deals, so prices actually resolve). For each ingredient we re-price the
    user's chosen product (current price incl. this week's sale) or pick the
    cheapest package; pantry items are excluded and returned in `already_have`.
    """
    if not settings.kroger_client_id or not settings.kroger_client_secret:
        raise HTTPException(503, "Kroger API not configured")

    ingredients = payload.get("ingredients", []) or []
    zip_code = payload.get("zip_code") or payload.get("user_zip")
    if not zip_code:
        raise HTTPException(422, "zip_code required")
    # Pantry with quantities: [{name, quantity, unit}]. Legacy pantry_names
    # (no qty) are treated as "have plenty" (infinite) for backward compat.
    pantry = []
    for p in (payload.get("pantry_items") or []):
        pantry.append((
            str(p.get("name", "")).lower().strip(),
            float(p.get("quantity") or 0),
            (p.get("unit") or "").lower().strip(),
        ))
    for nm in (payload.get("pantry_names") or []):
        pantry.append((str(nm).lower().strip(), float("inf"), ""))

    def _pantry_match(name: str):
        """Return (matched, total_quantity_on_hand) for an ingredient name."""
        n = (name or "").lower().strip()
        matched = False
        qty = 0.0
        for (pn, pq, _pu) in pantry:
            if len(pn) > 2 and (n in pn or pn in n):
                matched = True
                qty += pq
        return matched, qty

    def _eff(p):
        return p.get("sale_price") if p.get("sale_price") is not None else p.get("price")

    # How many packages/units to buy for a given amount + unit.
    #   • Count units (pcs, cans…) and bulk-weight units (lbs, kg) scale with the
    #     amount — Kroger prices meat/produce per pound, so 2 lbs = 2 × per-lb.
    #   • Small cooking measures (tsp, tbsp, oz, g…) mean you just buy ONE package
    #     and use a fraction of it.
    import math
    # Units where each unit IS a package you buy (2 pcs gravy = 2 packets).
    COUNT_UNITS = {"pcs", "cans"}
    # Bulk weight is priced per-unit by Kroger (2 lbs beef = 2 × per-lb).
    BULK_WEIGHT = {"lbs", "lb", "kg"}
    # Everything else (tsp, tbsp, cup, oz, ml, g, slices, cloves) → you buy ONE
    # package and use a portion (2 slices bread = 1 loaf).

    def _multiplier(amount, unit):
        a = amount if (isinstance(amount, (int, float)) and amount > 0) else 1
        u = (unit or "").lower().strip()
        if u in COUNT_UNITS:
            return max(1, math.ceil(a))
        if u in BULK_WEIGHT:
            return a
        return 1

    # Resolve the store once for direct product-by-id pricing.
    store_info = await get_kroger_store(zip_code)
    if not store_info:
        return {
            "total_cost": None,
            "ingredients": [],
            "already_have": [],
            "store_name": None,
            "store_chain": None,
            "pricing_unavailable": True,
            "pricing_note": f"No Kroger-family store found within {MAX_STORE_RADIUS_MILES} miles of {zip_code}. Live pricing coming soon for more stores.",
        }
    store_id = store_info["store_id"]
    store_chain = store_info["store_chain"]
    store_name = store_info["store_name"]

    results = []
    already_have = []
    total_cost = 0.0

    for ing in ingredients:
        name = (ing.get("name") or "").strip()
        if not name:
            continue

        amount = ing.get("amount", 1)
        unit = (ing.get("unit") or "")
        u = unit.lower().strip()
        is_scaling = u in COUNT_UNITS or u in BULK_WEIGHT
        matched, have_qty = _pantry_match(name)

        # Non-scaling units (tsp/tbsp/cup…): having ANY in the pantry means you
        # own a package → fully covered, nothing to buy.
        if matched and not is_scaling:
            already_have.append({"name": name, "have_qty": have_qty if have_qty != float("inf") else None})
            continue

        chosen_id = ing.get("product_id")
        best = None
        priced = []

        # 1. If the user chose a specific product, re-price it directly by ID.
        if chosen_id and store_id:
            try:
                by_id = await _fetch_products_by_id([chosen_id], store_id)
                by_id = [p for p in by_id if _eff(p) is not None]
                if by_id:
                    best = by_id[0]
            except Exception:
                best = None

        # 2. Otherwise (or if that failed) search by name for the cheapest.
        if best is None:
            try:
                found = await search_prices(
                    query=name, zip_code=zip_code, limit=15, current_user=current_user,
                )
            except Exception:
                results.append({"name": name, "error": "lookup failed"})
                continue
            priced = [p for p in (found or []) if _eff(p) is not None]
            if not priced:
                results.append({"name": name, "error": "no priced products"})
                continue
            priced.sort(key=lambda p: _eff(p))
            best = priced[0]
        else:
            # Offer name-based alternatives for the detail view, best-effort.
            try:
                found = await search_prices(
                    query=name, zip_code=zip_code, limit=8, current_user=current_user,
                )
                priced = sorted(
                    [p for p in (found or []) if _eff(p) is not None],
                    key=lambda p: _eff(p),
                )
            except Exception:
                priced = [best]

        unit_price = _eff(best)
        needed = _multiplier(amount, unit)  # how many units the recipe needs

        # Scaling units: subtract what's already in the pantry; only pay for the
        # remainder (have 1 of 2 gravy packets → buy 1).
        buy_qty = needed
        if matched and is_scaling:
            remaining = max(0, needed - have_qty)
            if remaining <= 0:
                already_have.append({"name": name, "have_qty": have_qty})
                continue
            buy_qty = math.ceil(remaining) if u in COUNT_UNITS else remaining

        cost = unit_price * buy_qty
        total_cost += cost

        results.append({
            "name": name,
            "needed_amount": amount,
            "needed_unit": unit,
            "product": best,
            "unit_price": round(unit_price, 2),
            "buy_quantity": round(buy_qty, 2),
            "have_quantity": round(have_qty, 2) if (matched and is_scaling and have_qty != float("inf")) else 0,
            "cost": round(cost, 2),
            "alternatives": priced[:6],
        })

    return {
        "total_cost": round(total_cost, 2),
        "ingredients": results,
        "already_have": already_have,
        "store_name": store_name,
        "store_chain": store_chain,
        "pricing_unavailable": False,
        "pricing_note": f"Live prices from {store_chain}",
    }


@router.get("/stores")
async def nearby_stores(
    zip_code: str = Query(..., min_length=5),
    radius: int = Query(35, le=100),
    current_user: User = Depends(get_current_user),
):
    """
    Kroger-family stores near a ZIP, ordered nearest-first (Kroger returns them
    in distance order). Returns a normalized, frontend-friendly shape.
    """
    if not settings.kroger_client_id or not settings.kroger_client_secret:
        raise HTTPException(503, "Kroger API not configured")

    cache_key = f"kroger_stores_{zip_code}_{radius}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    token = await get_kroger_token()
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            KROGER_LOCATIONS_URL,
            headers={"Authorization": f"Bearer {token}"},
            params={
                "filter.zipCode.near": zip_code,
                "filter.radiusInMiles": radius,
                "filter.limit": 10,
            },
        )
        resp.raise_for_status()
        raw = resp.json()

    stores = []
    for loc in raw.get("data", []):
        addr = loc.get("address", {}) or {}
        stores.append({
            "location_id": loc.get("locationId"),
            "name": loc.get("name", "Kroger"),
            "chain": loc.get("chain", "KROGER"),
            "address": addr.get("addressLine1", ""),
            "city": addr.get("city", ""),
            "state": addr.get("state", ""),
            "zip_code": addr.get("zipCode", ""),
        })

    cache_set(cache_key, stores, ttl_seconds=1800)
    return stores


# Items used to surface real on-sale products (the free Kroger API has no
# digital-circular endpoint; promo pricing on these is the honest "ad").
# A short staple set powers the Grocery preview; the broad set powers the full
# Deals page.
DEALS_STAPLES = [
    "milk", "eggs", "bread", "chicken breast", "ground beef",
    "butter", "cheese", "bananas", "coffee", "cereal",
]

DEALS_BROAD = DEALS_STAPLES + [
    "yogurt", "orange juice", "bacon", "ground turkey", "salmon",
    "pasta", "rice", "tomatoes", "potatoes", "onions", "apples",
    "strawberries", "lettuce", "frozen pizza", "ice cream",
    "soda", "chips", "peanut butter", "jelly", "flour", "sugar",
    "olive oil", "paper towels", "snacks",
]


@router.get("/deals")
async def store_deals(
    zip_code: str = Query(..., min_length=5),
    limit: int = Query(12, le=80),
    broad: bool = Query(False, description="Search a wider set of items for the full deals page"),
    current_user: User = Depends(get_current_user),
):
    """
    Real on-sale products near the user (items whose promo price beats regular).
    Sorted by largest savings.
    """
    if not settings.kroger_client_id or not settings.kroger_client_secret:
        raise HTTPException(503, "Kroger API not configured")

    terms = DEALS_BROAD if broad else DEALS_STAPLES
    cache_key = f"kroger_deals_{zip_code}_{limit}_{'b' if broad else 's'}"
    cached = cache_get(cache_key)
    if cached:
        return cached

    deals = []
    seen = set()
    for term in terms:
        try:
            results = await search_prices(
                query=term, zip_code=zip_code, limit=8, current_user=current_user,
            )
        except Exception:
            continue
        for r in results:
            pid = r.get("product_id")
            price = r.get("price")
            sale = r.get("sale_price")
            if not pid or pid in seen or price is None or sale is None or sale >= price:
                continue
            seen.add(pid)
            r["savings"] = round(price - sale, 2)
            deals.append(r)

    deals.sort(key=lambda d: d["savings"], reverse=True)
    deals = deals[:limit]
    cache_set(cache_key, deals, ttl_seconds=1800)
    return deals
