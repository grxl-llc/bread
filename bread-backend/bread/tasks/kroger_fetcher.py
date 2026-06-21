from bread.adapters.kroger_adapter import KrogerAdapter
from bread.parsers.kroger_parser import KrogerParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price

adapter = KrogerAdapter()

async def fetch_kroger_prices(query: str, db, zip_code: str):
    print("KROGER FETCHER STARTED:", query)

    data = await adapter.search(query, zip_code)
    results = KrogerParser.parse_search(data)

    stored = []
    for item in results:
        product = get_or_create_product(
            db=db,
            name=item["name"],
            external_id=item["product_id"],
        )

        if item["price"] is not None:
            create_or_update_price(
                db=db,
                product_id=product.id,
                store_id=2,  # TODO: map Kroger store ID
                ingredient_id=product.id,  # TEMP until mapping is built
                zip_code=zip_code,
                price=item["price"],
                source="kroger_api",
                confidence=0.95,
                is_true_price=True,
                raw_payload=None,
            )

        stored.append(item)

    return stored
