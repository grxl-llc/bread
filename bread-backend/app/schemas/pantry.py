from pydantic import BaseModel
from typing import Optional


class PantryItemBase(BaseModel):
    ingredient_id: int
    quantity: float
    unit: str


class PantryItemCreate(PantryItemBase):
    pass


class PantryItem(PantryItemBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode

