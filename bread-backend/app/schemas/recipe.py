from pydantic import BaseModel
from typing import Optional, List


class RecipeBase(BaseModel):
    name: str
    ingredients: List[str]
    instructions: Optional[str] = None
    image_url: Optional[str] = None


class RecipeCreate(RecipeBase):
    pass


class Recipe(RecipeBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
