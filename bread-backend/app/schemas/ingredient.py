from pydantic import BaseModel
from typing import Optional


class IngredientBase(BaseModel):
    name: str
    category: Optional[str] = None


class IngredientCreate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
