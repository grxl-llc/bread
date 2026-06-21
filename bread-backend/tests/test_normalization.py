from app.pricing.normalization import normalize_price_record

# Fake product samples from different retailers
samples = [
    {
        "retailer": "kroger",
        "retailer_product_id": "0001111086750",
        "name": "Boneless Skinless Chicken Breast",
        "price_raw": "$3.49",
        "size_raw": "1 lb",
        "source": "kroger_api",
        "retailer_product_url": "https://www.kroger.com/p/0001111086750",
    },
    {
        "retailer": "walmart",
        "retailer_product_id": "123456",
        "name": "Great Value Whole Milk",
        "price_raw": "$2.89",
        "size_raw": "1 gal",
        "source": "fake_walmart",
        "retailer_product_url": "https://www.walmart.com/ip/123456",
    },
    {
        "retailer": "target",
        "retailer_product_id": "A-987654",
        "name": "Organic Baby Spinach",
        "price_raw": "$4.99",
        "size_raw": "16 oz",
        "source": "fake_target",
        "retailer_product_url": "https://www.target.com/p/A-987654",
    },
    {
        "retailer": "aldi",
        "retailer_product_id": "ALDI-222",
        "name": "Cage Free Eggs",
        "price_raw": "$3.29",
        "size_raw": "12 ct",
        "source": "fake_aldi",
        "retailer_product_url": "https://aldi.us/ALDI-222",
    },
]

print("\n=== NORMALIZATION TEST ===\n")

for sample in samples:
    normalized = normalize_price_record(
        retailer=sample["retailer"],
        retailer_product_id=sample["retailer_product_id"],
        name=sample["name"],
        price_raw=sample["price_raw"],
        size_raw=sample["size_raw"],
        source=sample["source"],
        retailer_product_url=sample["retailer_product_url"],
    )

    print(f"--- {sample['name']} ({sample['retailer']}) ---")
    print(normalized.model_dump())
    print()
