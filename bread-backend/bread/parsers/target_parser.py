class TargetParser:
    @staticmethod
    def parse_search(data: dict):
        items = data.get("data", {}).get("search", {}).get("products", [])
        results = []

        for item in items:
            price_info = item.get("price", {})
            current_price = price_info.get("current_retail")

            results.append({
                "name": item.get("title"),
                "price": current_price,
                "product_id": item.get("tcin"),
                "store": "Target",
                "is_true_price": True,  # Target API = real prices
            })

        return results
