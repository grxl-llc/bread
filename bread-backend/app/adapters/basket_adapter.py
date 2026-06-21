def normalize_basket_product(raw: dict):
    """
    Convert Basket's raw product JSON into Bread's unified product schema.
    """

    return {
        "product_id": raw.get("id"),
        "name": raw.get("name"),
        "brand": raw.get("brand"),
        "image": raw.get("image"),
        "size": raw.get("size"),
        "price": raw.get("price", {}).get("value"),
        "unit_price": raw.get("price", {}).get("unit_price"),
        "unit": raw.get("price", {}).get("unit"),
        "category": raw.get("category"),
        "nutrition": raw.get("nutrition", {}),
        "store_id": raw.get("store_id"),
    }
