class BasketParser:
    @staticmethod
    def parse_search(data: dict):
        items = data.get("results", [])
        results = []

        for item in items:
            results.append({
                "name": item.get("name"),
                "price": item.get("price"),
                "store": item.get("store"),
                "store_id": item.get("store_id"),
                "product_id": item.get("product_id"),
            })

        return results
