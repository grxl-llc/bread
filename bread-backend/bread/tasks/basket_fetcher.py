from bread.adapters.basket_adapter import BasketAdapter
from bread.parsers.basket_parser import BasketParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price


adapter = BasketAdapter()


async def fetch_basket_prices(query: str, db):
    print("BASKET FETCHER STARTED:", query)

    data = await adapter.search(query)
    print("BASKET FETCHER: received keys:", list(data.keys()))

    results = BasketParser.parse_search(data)
    print("BASKET FETCHER: parsed results:", results)

    stored = []
    for item in results:
        product = get_or_create_product(
            db=db,
            name=item["name"],
            external_id=item["product_id"],
        )

        if item["price"]:
            create_or_update_price(
                db=db,
                product_id=product.id,
                store=item["store"],
                price=item["price"],
                source="basket",
                confidence=0.8,
                is_true_price=True,  # Basket is usually accurate
            )

        stored.append(item)

    return stored
