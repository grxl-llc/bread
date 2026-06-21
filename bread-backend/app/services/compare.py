from fastapi import HTTPException

from app.adapters.kroger_adapter import KrogerAdapter
# Future:
# from app.adapters.walmart_adapter import WalmartAdapter
# from app.adapters.target_adapter import TargetAdapter


async def compare_stores_service(payload: dict):
    """
    Compare recipe cost across all available store adapters.
    Extracted from router for reuse and clarity.
    """

    ingredients = payload.get("ingredients", [])
    user_zip = payload.get("user_zip", "27576")
    radius = payload.get("radius", 35)
    store_id = payload.get("store_id")  # optional override

    if not ingredients:
        raise HTTPException(400, "Missing ingredients list")

    # List of store adapters (future-proof)
    adapters = {
        "kroger": KrogerAdapter(),
        # "walmart": WalmartAdapter(),
        # "target": TargetAdapter(),
    }

    results = []

    # Run cost calculation for each store
    for store_name, adapter in adapters.items():
        try:
            cost_data = await adapter.calculate_recipe_cost(
                ingredients=ingredients,
                user_zip=user_zip,
                radius=radius,
                store_id=store_id
            )

            results.append({
                "store": store_name,
                "total_cost": cost_data["total_cost"],
                "details": cost_data
            })

        except Exception as e:
            results.append({
                "store": store_name,
                "error": str(e)
            })

    # Sort by total cost (lowest first)
    results = sorted(
        [r for r in results if "total_cost" in r],
        key=lambda x: x["total_cost"]
    )

    return {"comparison": results}
