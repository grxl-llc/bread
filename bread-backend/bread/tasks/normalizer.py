def normalize_to_bread_format(ingredient, product, store, price_data, source_type: str):
    return {
        "ingredient_id": ingredient["id"],
        "product_id": product["id"],
        "store_id": store["id"],
        "zip_code": store.get("zip_code") or price_data.get("zip_code"),
        "price": price_data.get("price"),
        "sale_price": price_data.get("sale_price"),
        "currency": "USD",
        "source_type": source_type,
        "confidence_score": price_data.get("confidence", 0.5),
        "raw_payload": price_data,
    }
