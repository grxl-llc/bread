import httpx
from sqlalchemy.orm import Session

from bread.adapters.kroger_auth import KrogerAuth
from bread.crud import stores as store_crud
from bread.crud import products as product_crud
from bread.crud import product_prices as price_crud


class KrogerFetcher:
    BASE_URL = "https://api.kroger.com/v1"

    def __init__(self, db: Session):
        self.db = db
        self.auth = KrogerAuth()

    async def _get_headers(self):
        token = await self.auth.get_token()
        return {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json"
        }

    # ---------------------------------------------------------
    # 1. STORE LOOKUP
    # ---------------------------------------------------------
    async def fetch_store(self, zip_code: str):
        """
        Finds the nearest Kroger store for a ZIP code.
        Writes/updates the store in DB.
        Returns normalized store object.
        """
        headers = await self._get_headers()

        params = {
            "filter.zipCode.near": zip_code,
            "filter.limit": 1
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/locations",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            data = response.json()

        if not data.get("data"):
            return None

        store = data["data"][0]
        store_id = store["locationId"]

        # Normalize store data
        store_data = {
            "retailer": "kroger",
            "store_id": store_id,
            "name": store["name"],
            "address": store["address"].get("addressLine1"),
            "city": store["address"].get("city"),
            "state": store["address"].get("state"),
            "zip_code": store["address"].get("zipCode"),
            "raw_payload": store
        }

        # Write to DB
        db_store = store_crud.create_or_update_store(self.db, store_data)
        return db_store

    # ---------------------------------------------------------
    # 2. PRODUCT SEARCH
    # ---------------------------------------------------------
    async def search_products(self, store_id: str, query: str):
        """
        Searches Kroger for products at a specific store.
        Writes/updates products in DB.
        Returns list of normalized product objects.
        """
        headers = await self._get_headers()

        params = {
            "filter.term": query,
            "filter.locationId": store_id,
            "filter.limit": 20
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.BASE_URL}/products",
                headers=headers,
                params=params
            )
            response.raise_for_status()
            data = response.json()

        products = data.get("data", [])
        normalized_products = []

        for p in products:
            product_id = p["productId"]

            product_data = {
                "retailer": "kroger",
                "product_id": product_id,
                "name": p.get("description"),
                "brand": p.get("brand"),
                "size": p.get("items", [{}])[0].get("size"),
                "raw_payload": p
            }

            db_product = product_crud.create_or_update_product(self.db, product_data)
            normalized_products.append(db_product)

        return normalized_products

    # ---------------------------------------------------------
    # 3. PRICE EXTRACTION
    # ---------------------------------------------------------
    async def fetch_prices(self, store_id: str, product):
        """
        Extracts price for a single product.
        Writes/updates ProductPrice in DB.
        Returns normalized price object.
        """
        raw = product.raw_payload

        # Kroger price lives inside items → price
        items = raw.get("items", [])
        if not items:
            return None

        price_info = items[0].get("price", {})
        regular = price_info.get("regular")
        promo = price_info.get("promo")

        price_data = {
            "retailer": "kroger",
            "store_id": store_id,
            "product_id": product.product_id,
            "regular_price": regular,
            "promo_price": promo,
            "raw_payload": price_info
        }

        db_price = price_crud.create_or_update_product_price(self.db, price_data)
        return db_price

    # ---------------------------------------------------------
    # 4. ORCHESTRATION: ZIP + QUERY → STORE + PRODUCTS + PRICES
    # ---------------------------------------------------------
    async def fetch_kroger_prices(self, zip_code: str, query: str):
        """
        Full pipeline:
        - Find store by ZIP
        - Search products
        - Fetch prices
        - Return normalized list
        """
        store = await self.fetch_store(zip_code)
        if not store:
            return {"error": "No Kroger store found for this ZIP"}

        products = await self.search_products(store.store_id, query)

        results = []
        for product in products:
            price = await self.fetch_prices(store.store_id, product)
            results.append({
                "store": store,
                "product": product,
                "price": price
            })

        return results
