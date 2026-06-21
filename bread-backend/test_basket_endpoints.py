import asyncio
import httpx

async def test():
    endpoints = [
        "https://www.basketapi.com/api/search",
        "https://www.basketapi.com/api/v1/search",
        "https://www.basketapi.com/api/v2/search",
        "https://www.basketapi.com/products/search",
        "https://www.basketapi.com/search",
        "https://basketapi.com/api/search",
        "https://basketapi.com/api/v1/search",
        "https://basketapi.com/api/v2/search",
        "https://basketapi.com/products/search",
        "https://basketapi.com/search",
    ]

    for url in endpoints:
        print("\n==============================")
        print("Testing:", url)
        print("==============================")

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                r = await client.get(url, params={"q": "milk", "zip": "27576"})
                print("Status:", r.status_code)
                print("Body:", r.text[:300])
        except Exception as e:
            print("Error:", e)

asyncio.run(test())
