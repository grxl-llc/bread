import asyncio
import httpx
from typing import List, Dict, Any, Optional


class BasketAdapter:
    BASE_URL = "https://www.basketapi.com/api"  # may need adjustment once we see real responses

    def __init__(self, timeout: float = 10.0, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    async def _request(self, method: str, url: str, **kwargs) -> Optional[httpx.Response]:
        """
        Hardened request with retries, timeouts, and basic backoff.
        """
        for attempt in range(1, self.max_retries + 1):
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    response = await client.request(method, url, **kwargs)

                # Handle rate limiting or temporary blocks
                if response.status_code in (429, 503):
                    await asyncio.sleep(1.5 * attempt)
                    continue

                # Hard blocks / firewalls
                if response.status_code in (401, 403):
                    # Return None so caller can decide what to do
                    return None

                response.raise_for_status()
                return response

            except httpx.RequestError:
                # Network-level error, retry
                await asyncio.sleep(1.0 * attempt)
                continue
            except httpx.HTTPStatusError:
                # Non-retryable HTTP error
                return None

        return None

    async def search_products(self, zip_code: str, query: str):
        url = f"{self.BASE_URL}/search"

        params = {
            "q": query,
            "zip": zip_code,
            "limit": 20,
        }

        headers = {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        }

        response = await self._request("GET", url, params=params, headers=headers)

        if response is None:
            print("❌ Basket returned None (blocked or invalid endpoint)")
            return []

        print("🔍 RAW RESPONSE TEXT:")
        print(response.text[:1000])  # print first 1000 chars

        try:
            data = response.json()
        except Exception:
            print("❌ Could not parse JSON")
            return []

        print("🔍 PARSED JSON KEYS:", list(data.keys()))

        items = data.get("items") or data.get("results") or data.get("data") or []

        print(f"🔍 Extracted {len(items)} items from JSON")

        normalized = []
        for item in items:
            normalized.append({
                "retailer": item.get("retailer") or item.get("store_name"),
                "store_id": item.get("store_id"),
                "product_id": item.get("id") or item.get("product_id"),
                "name": item.get("name") or item.get("title"),
                "brand": item.get("brand"),
                "size": item.get("size"),
                "price": item.get("price") or item.get("unit_price"),
                "raw": item,
            })

        return normalized
