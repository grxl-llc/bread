from pydantic import BaseModel
from typing import Optional


class IngredientSubstitutionRequest(BaseModel):
    ingredient: dict
    store_id: Optional[str] = None
    user_zip: str = "27576"
    radius: int = 35
    limit: int = 3
