import httpx
from bread.adapters.kroger_auth import KrogerAuth


class KrogerAdapter:
    BASE_URL = "https://api.kroger.com/v1/products"

    def __init__(self):
        self.auth = KrogerAuth()

    async def get_store_id(self, zip_code: str):
        """
        Convert ZIP code → Kroger store locationId.
        Kroger does NOT accept ZIP codes directly for product search.
        """
        token = await self.auth.get_token()

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        params = {
            "filter.zipCode.near": zip_code,
            "filter.limit": 1,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.kroger.com/v1/locations",
                headers=headers,
                params=params,
            )
            response.raise_for_status()
            data = response.json()

            if not data.get("data"):
                return None

            return data["data"][0]["locationId"]

    async def search(self, query: str, zip_code: str):
        """
        Search Kroger products using a storeId derived from the ZIP code.
        """
        token = await self.auth.get_token()

        # Step 1: Convert ZIP → storeId
        store_id = await self.get_store_id(zip_code)
        if not store_id:
            return {"error": f"No Kroger stores found near ZIP {zip_code}"}

        headers = {
            "Authorization": f"Bearer {token}",
            "Accept": "application/json",
        }

        params = {
            "filter.term": query,
            "filter.locationId": store_id,
            "filter.limit": 20,
        }

        async with httpx.AsyncClient() as client:
            response = await client.get(self.BASE_URL, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
