class StoreAdapter:
    async def calculate_recipe_cost(self, ingredients, user_zip, radius, store_id=None):
        """
        All store adapters must implement this method.
        """
        raise NotImplementedError("Store adapter must implement calculate_recipe_cost()")
