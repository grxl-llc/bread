from pydantic import BaseModel
from typing import List, Optional


class Ingredient(BaseModel):
    name: str
    amount: float = 1
    unit: str = ""
    category: Optional[str] = None
    product_id: Optional[str] = None  # the brand the user chose — re-priced live


class RecipeCostRequest(BaseModel):
    ingredients: List[Ingredient]
    store_id: Optional[str] = None
    user_zip: str = "27576"
    radius: int = 35
    pantry_names: Optional[List[str]] = []  # items already owned — excluded from cost
