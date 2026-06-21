import asyncio
from bread.adapters.google_shopping_adapter import GoogleShoppingAdapter

async def main():
    adapter = GoogleShoppingAdapter()
    query = "milk"

    print(f"Testing Google Shopping for query={query!r}")
    results = await adapter.search(query)

    print(f"Got {len(results)} results")
    for item in results[:5]:
        print(f"- {item['store']} | {item['name']} | {item['price']}")

if __name__ == "__main__":
    asyncio.run(main())
