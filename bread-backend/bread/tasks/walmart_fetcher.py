from bread.adapters.walmart_api_adapter import WalmartAPIAdapter
from bread.parsers.walmart_api_parser import WalmartAPIParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price


adapter = WalmartAPIAdapter()


async def fetch_walmart_prices(query: str, db):
    print("FETCHER STARTED:", query)

    # 1. Fetch JSON from Walmart API
    data = await adapter.search(query)
    print("FETCHER: received keys:", list(data.keys()))

    # 2. Parse into structured results
    results = WalmartAPIParser.parse_search(data)
    print("FETCHER: parsed results:", results)

    # 3. Store results in DB
    stored = []
    for item in results:
        product = get_or_create_product(
            db=db,
            name=item["name"],
            external_id=item["external_id"],
        )

        if item["price"]:
            create_or_update_price(
                db=db,
                product_id=product.id,
                store="walmart",
                price=item["price"],
            )

        stored.append(item)

    return stored
