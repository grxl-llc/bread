import random

class KrogerAdapter:
    def search_product(self, query: str, zip_code: str):
        # TODO: replace with real unauthenticated search
        return {
            "external_id": f"kroger-{query.replace(' ', '-')}",
            "confidence": 0.6,
        }

    def get_price(self, product_external_id: str, zip_code: str):
        # TODO: replace with real unauthenticated price fetch
        price = round(random.uniform(2.0, 4.5), 2)
        return {
            "price": price,
            "sale_price": None,
            "confidence": 0.6,
            "external_id": product_external_id,
            "zip_code": zip_code,
            "source": "kroger_unauthenticated",
        }
