from app.adapters.base import StoreAdapter
from app.services.recipe_cost import calculate_recipe_cost_service

class KrogerAdapter(StoreAdapter):
    async def calculate_recipe_cost(self, ingredients, user_zip, radius, store_id=None):
        payload = {
            "ingredients": ingredients,
            "store_id": store_id,
            "user_zip": user_zip,
            "radius": radius
        }
        return await calculate_recipe_cost_service(payload)

