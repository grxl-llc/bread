from bread.adapters.instacart_adapter import InstacartAdapter
from bread.parsers.instacart_parser import InstacartParser

from bread.crud.products import get_or_create_product
from bread.crud.product_prices import create_or_update_price


adapter = InstacartAdapter()


async def fetch_instacart_prices(query: str, db, zip_code: str | None = None):
    print("INSTACART FETCHER STARTED:", query)

    html = await adapter.search(query, zip_code=zip_code)
    print("INSTACART FETCHER: HTML length:", len(html))

    # Optional: dump for inspection while we refine selectors
    with open("instacart_debug.html", "w", encoding="utf-8", errors="ignore") as f:
        f.write(html)
    print("INSTACART FETCHER: wrote instacart_debug.html")

    results = InstacartParser.parse_search(html)
    print("INSTACART FETCHER: parsed results:", results)

    stored = []
    for item in results:
        product = get_or_create_product(
            db=db,
            name=item["name"],
            external_id=None,  # Instacart IDs can be added later if we parse them
        )

        if item["price"]:
            # Basic confidence logic: higher if true price, lower if marked up
            confidence = 0.9 if item["is_true_price"] else 0.5

            create_or_update_price(
                db=db,
                product_id=product.id,
                store=item["store"] or "instacart",
                price=item["price"],
                source="instacart",
                is_true_price=item["is_true_price"],
                confidence=confidence,
            )

        stored.append(item)

    return stored
