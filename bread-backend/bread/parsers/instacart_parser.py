from bs4 import BeautifulSoup
import re


class InstacartParser:
    @staticmethod
    def parse_search(html: str):
        soup = BeautifulSoup(html, "html.parser")

        results = []

        # Instacart product cards are often in <div> with data-test attributes
        # This may need refinement once we inspect real HTML.
        product_cards = soup.select("div[data-test='item-card']")

        for card in product_cards:
            name_el = card.select_one("[data-test='item-name'], h2, h3")
            price_el = card.select_one("[data-test='item-price'], span")
            store_el = card.select_one("[data-test='store-name']")
            badge_el = card.find(string=lambda t: t and "Prices higher than in store" in t)

            if not name_el or not price_el:
                continue

            name = name_el.get_text(strip=True)
            price_text = price_el.get_text(strip=True)

            price_match = re.search(r"[\d,.]+", price_text)
            price = float(price_match.group().replace(",", "")) if price_match else None

            store = store_el.get_text(strip=True) if store_el else None

            is_true_price = badge_el is None  # if no markup badge, treat as true price

            results.append({
                "name": name,
                "price": price,
                "store": store,
                "is_true_price": is_true_price,
            })

        return results
