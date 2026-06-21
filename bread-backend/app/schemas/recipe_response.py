from pydantic import BaseModel
from typing import List, Optional


class RecipeCostIngredientResult(BaseModel):
    name: str
    needed_amount: float
    needed_unit: str
    product: dict
    packages_needed: int
    cost: float


class RecipeCostResponse(BaseModel):
    store_id: str
    total_cost: float
    ingredients: List[RecipeCostIngredientResult]
