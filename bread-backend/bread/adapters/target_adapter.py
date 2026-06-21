import httpx

class TargetAdapter:
    BASE_URL = "https://redsky.target.com/redsky_aggregations/v1/web/plp_search_v1"

    async def search(self, query: str, zip_code: str):
        params = {
            "keyword": query,
            "store_id": "3991",  # fallback store
            "zip": zip_code,
            "channel": "WEB",
            "count": 24,
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            ),
            "Accept": "application/json",
        }

        async with httpx.AsyncClient(
            follow_redirects=True,
            headers=headers,
            timeout=10.0,
        ) as client:
            response = await client.get(self.BASE_URL, params=params)
            response.raise_for_status()
            return response.json()
