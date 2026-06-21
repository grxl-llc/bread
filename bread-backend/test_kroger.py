import asyncio
from bread.adapters.kroger_adapter import KrogerAdapter

async def test():
    adapter = KrogerAdapter()
    store_id = await adapter.get_store_id("27576")
    print("STORE ID:", store_id)

asyncio.run(test())
