import asyncio

from bread.adapters.basket_adapter import BasketAdapter


async def main():
    adapter = BasketAdapter()

    zip_code = "27576"  # Smithfield, NC
    query = "milk"

    print(f"Testing Basket for ZIP={zip_code}, query={query!r}")
    results = await adapter.search_products(zip_code=zip_code, query=query)

    print(f"Got {len(results)} results")
    for item in results[:5]:
        print(
            f"- {item['retailer']} | {item['name']} | "
            f"{item['size']} | {item['price']}"
        )


if __name__ == "__main__":
    asyncio.run(main())
