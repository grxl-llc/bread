import random

class WalmartAdapter:
    def search_product(self, query: str, zip_code: str):
        # TODO: replace with real unauthenticated search (scraping/public endpoint)
        # For now, return a fake external_id
        return {
            "external_id": f"walmart-{query.replace(' ', '-')}",
            "confidence": 0.6,
        }

    def get_price(self, product_external_id: str, zip_code: str):
        # TODO: replace with real unauthenticated price fetch
        # For now, return a fake price
        price = round(random.uniform(2.5, 5.0), 2)
        return {
            "price": price,
            "sale_price": None,
            "confidence": 0.6,
            "external_id": product_external_id,
            "zip_code": zip_code,
            "source": "walmart_unauthenticated",
        }
