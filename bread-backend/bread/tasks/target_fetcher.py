from bread.adapters.target_adapter import TargetAdapter
from bread.parsers.target_parser import TargetParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price


adapter = TargetAdapter()


async def fetch_target_prices(query: str, db, zip_code: str):
    print("TARGET FETCHER STARTED:", query)

    data = await adapter.search(query, zip_code)
    results = TargetParser.parse_search(data)

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
                store_id=1,  # TODO: map Target store ID
                ingredient_id=product.id,  # TEMP until mapping is built
                zip_code=zip_code,
                price=item["price"],
                source="target_api",
                confidence=0.9,
                is_true_price=True,
                raw_payload=None,
            )

        stored.append(item)

    return stored
