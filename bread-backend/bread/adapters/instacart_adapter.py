import httpx


class InstacartAdapter:
    BASE_URL = "https://www.instacart.com/store/search"

    async def search(self, query: str, zip_code: str | None = None):
        params = {
            "q": query,
        }

        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/123.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }

        cookies = {}
        if zip_code:
            # Instacart uses location context; this is a placeholder for future refinement
            cookies["ic_zip"] = zip_code

        async with httpx.AsyncClient(
            follow_redirects=True,
            headers=headers,
            timeout=10.0,
        ) as client:
            response = await client.get(self.BASE_URL, params=params, cookies=cookies)
            response.raise_for_status()
            return response.text
