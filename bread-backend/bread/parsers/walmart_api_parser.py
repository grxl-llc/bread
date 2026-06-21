class WalmartAPIParser:
    @staticmethod
    def parse_search(data: dict):
        try:
            items = data["data"]["search"]["items"]
        except Exception:
            return []

        results = []
        for item in items:
            results.append({
                "name": item.get("name"),
                "external_id": item.get("usItemId"),
                "price": (
                    item.get("priceInfo", {})
                        .get("currentPrice", {})
                        .get("price")
                ),
            })

        return results
