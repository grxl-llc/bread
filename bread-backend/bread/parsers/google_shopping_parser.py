from bs4 import BeautifulSoup
import re


class GoogleShoppingParser:
    @staticmethod
    def parse_search(html: str):
        soup = BeautifulSoup(html, "html.parser")

        results = []

        # Google Shopping product cards
        items = soup.select("div.sh-dgr__content")
        for item in items:
            name_el = item.select_one("h3")
            price_el = item.select_one(".a8Pemb")
            store_el = item.select_one(".aULzUe")

            if not name_el or not price_el:
                continue

            name = name_el.get_text(strip=True)
            price_text = price_el.get_text(strip=True)

            # Extract numeric price
            price_match = re.search(r"[\d,.]+", price_text)
            price = float(price_match.group().replace(",", "")) if price_match else None

            store = store_el.get_text(strip=True) if store_el else None

            results.append({
                "name": name,
                "price": price,
                "store": store,
            })

        return results
