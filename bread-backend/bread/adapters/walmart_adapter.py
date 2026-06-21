import httpx


class WalmartAdapter:
    BASE_URL = "https://www.walmart.com/search"

    async def search(self, query: str) -> str:
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Referer": "https://www.google.com/",
        }

        async with httpx.AsyncClient(
            follow_redirects=True,
            headers=headers,
            timeout=10.0,
        ) as client:
            response = await client.get(self.BASE_URL, params={"q": query})
            response.raise_for_status()
            return response.text
