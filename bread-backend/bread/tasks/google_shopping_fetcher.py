from bread.adapters.google_shopping_adapter import GoogleShoppingAdapter
from bread.parsers.google_shopping_parser import GoogleShoppingParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price


adapter = GoogleShoppingAdapter()


async def fetch_google_prices(query: str, db):
    print("GOOGLE FETCHER STARTED:", query)

    html = await adapter.search(query)
    print("GOOGLE FETCHER: HTML length:", len(html))

    # Dump HTML for inspection
    with open("google_debug.html", "w", encoding="utf-8", errors="ignore") as f:
        f.write(html)
    print("GOOGLE FETCHER: wrote google_debug.html")

    results = GoogleShoppingParser.parse_search(html)
    print("GOOGLE FETCHER: parsed results:", results)

    stored = []
    for item in results:
        product = get_or_create_product(
            db=db,
            name=item["name"],
            external_id=None,
        )

        if item["price"]:
            create_or_update_price(
                db=db,
                product_id=product.id,
                store=item["store"] or "google",
                price=item["price"],
            )

        stored.append(item)

    return stored
