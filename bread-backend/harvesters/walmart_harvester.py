import asyncio
from playwright.async_api import async_playwright


async def harvest_walmart(query: str):
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Go to Walmart search
        search_url = f"https://www.walmart.com/search?q={query}"
        print(f"Navigating to {search_url}")
        await page.goto(search_url, wait_until="networkidle")

        # Wait for product tiles
        await page.wait_for_selector("div.search-result-gridview-items, div[data-item-id]", timeout=15000)

        # Grab product cards
        items = await page.query_selector_all("div[data-item-id]")  # flexible selector

        results = []
        for item in items[:10]:
            title_el = await item.query_selector("a[aria-label], span.lh-title")
            price_el = await item.query_selector("span[aria-hidden='true'] span")

            title = (await title_el.inner_text()) if title_el else None
            price = (await price_el.inner_text()) if price_el else None

            if title and price:
                results.append({"retailer": "Walmart", "name": title.strip(), "price": price.strip()})

        await browser.close()
        return results


async def main():
    query = "milk"
    results = await harvest_walmart(query)
    print(f"Got {len(results)} results from Walmart for {query!r}")
    for r in results:
        print(f"- {r['retailer']} | {r['name']} | {r['price']}")


if __name__ == "__main__":
    asyncio.run(main())
