from bs4 import BeautifulSoup

class WalmartParser:
    @staticmethod
    def parse_search(html: str):
        """
        Extracts product name, external_id (item ID), and price from Walmart search HTML.
        Returns a list of dicts.
        """
        soup = BeautifulSoup(html, "html.parser")
        results = []

        # Walmart changes classes often, so we look for anchors with product links
        for link in soup.select("a[href*='/ip/']"):
            href = link.get("href")
            if not href:
                continue

            # Extract item ID from /ip/<id>
            try:
                item_id = href.split("/ip/")[1].split("/")[0].split("?")[0]
            except Exception:
                continue

            name = link.get_text(strip=True)

            # Price extraction (best-effort)
            price_el = link.find_next("span", {"class": "price-characteristic"})
            price = price_el.get("content") if price_el else None

            results.append({
                "name": name,
                "external_id": item_id,
                "price": price,
            })

        return results

    @staticmethod
    def parse_item(html: str):
        """
        Extracts product name + price from a Walmart item page.
        """
        soup = BeautifulSoup(html, "html.parser")

        # Title
        title_el = soup.select_one("h1")
        name = title_el.get_text(strip=True) if title_el else None

        # Price
        price_el = soup.select_one("span.price-characteristic")
        price = price_el.get("content") if price_el else None

        return {
            "name": name,
            "price": price,
        }
