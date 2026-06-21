import asyncio
import httpx
from selectolax.parser import HTMLParser
from typing import List, Dict, Any, Optional


class GoogleShoppingAdapter:
    BASE_URL = "https://www.google.com/search"

    def __init__(self, timeout: float = 10.0, max_retries: int = 3):
        self.timeout = timeout
        self.max_retries = max_retries

    async def _request(self, url: str, params: dict) -> Optional[str]:
        """
        Hardened GET request with redirect-following and debug output.
        """
        headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/122.0.0.0 Safari/537.36"
            ),
            "Accept-Language": "en-US,en;q=0.9",
        }

        async with httpx.AsyncClient(
            timeout=self.timeout,
            follow_redirects=True
        ) as client:
            try:
                r = await client.get(url, params=params, headers=headers)

                print(f"🔍 FINAL STATUS CODE: {r.status_code}")
                print(f"🔍 FINAL URL: {r.url}")
                print(f"🔍 FIRST 500 CHARS:\n{r.text[:500]}\n")

                if r.status_code in (403, 401):
                    print("❌ BLOCKED BY GOOGLE")
                    return None

                r.raise_for_status()
                return r.text

            except Exception as e:
                print(f"❌ REQUEST ERROR: {e}")
                return None

    def _parse_results(self, html: str) -> List[Dict[str, Any]]:
        """
        Parse Google Shopping HTML using selectolax.
        Supports both old and new Shopping UI.
        """
        tree = HTMLParser(html)
        results = []

        # NEW Google Shopping UI (udm=28)
        product_nodes = tree.css("div.sh-pr__product")

        # Fallback to older UI
        if not product_nodes:
            product_nodes = tree.css("div.sh-dgr__content")

        for node in product_nodes:
            title = (
                node.css_first("div.sh-np__product-title")
                or node.css_first("h3")
                or node.css_first("span.T14wmb")
            )

            price = node.css_first("span.a8Pemb")
            store = node.css_first("div.aULzUe")
            link = node.css_first("a.shntl")

            results.append({
                "name": title.text(strip=True) if title else None,
                "price": price.text(strip=True) if price else None,
                "store": store.text(strip=True) if store else None,
                "link": (
                    "https://www.google.com" + link.attributes.get("href")
                    if link else None
                ),
                "raw": node.html,
            })

        return results

    async def search(self, query: str) -> List[Dict[str, Any]]:
        """
        Search Google Shopping using the new Shopping UI (udm=28).
        """
        params = {
            "q": query,
            "udm": "28",  # NEW SHOPPING UI
        }

        html = await self._request(self.BASE_URL, params)
        if not html:
            print("❌ No HTML returned")
            return []

        print("\n🔍 RAW HTML (first 2000 chars):\n")
        print(html[:2000])
        print("\n🔍 END RAW HTML\n")

        return self._parse_results(html)
