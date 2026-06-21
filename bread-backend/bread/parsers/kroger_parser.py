class KrogerParser:
    @staticmethod
    def parse_search(data):
        """
        Parse Kroger product search results into a normalized list.
        """
        items = []

        if not data or "data" not in data:
            return items

        for product in data["data"]:
            product_id = product.get("productId")
            description = product.get("description")
            items_list = product.get("items", [])

            price = None
            if items_list:
                price_info = items_list[0].get("price", {})
                price = price_info.get("regular")

            items.append({
                "product_id": product_id,
                "name": description,
                "price": price,
            })

        return items
