from pydantic import BaseModel
from typing import List, Optional


# -------------------------
# USER SCHEMAS
# -------------------------

class UserBase(BaseModel):
    username: str
    email: str
    zipcode: str
    preferred_stores: List[str]


class UserCreate(UserBase):
    pass


class User(UserBase):
    id: int

    class Config:
        from_attributes = True


# -------------------------
# RECIPE SCHEMAS
# -------------------------

class RecipeBase(BaseModel):
    name: str
    ingredients: List[str]
    instructions: str
    image_url: Optional[str] = None


class RecipeCreate(RecipeBase):
    pass


class Recipe(RecipeBase):
    id: int

    class Config:
        from_attributes = True


# -------------------------
# HOUSEHOLD SCHEMAS
# -------------------------

class HouseholdBase(BaseModel):
    name: str


class HouseholdCreate(HouseholdBase):
    pass


class Household(HouseholdBase):
    id: int

    class Config:
        from_attributes = True


# -------------------------
# HOUSEHOLD MEMBER SCHEMAS
# -------------------------

class HouseholdMemberBase(BaseModel):
    name: str
    age: Optional[int] = None
    dietary_restrictions: Optional[List[str]] = None


class HouseholdMemberCreate(HouseholdMemberBase):
    household_id: int


class HouseholdMember(HouseholdMemberBase):
    id: int
    household_id: int

    class Config:
        from_attributes = True


# -------------------------
# STORE SCHEMAS
# -------------------------

class StoreBase(BaseModel):
    name: str
    store_type: str


class StoreCreate(StoreBase):
    pass


class Store(StoreBase):
    id: int

    class Config:
        from_attributes = True


# -------------------------
# INGREDIENT SCHEMAS
# -------------------------

class IngredientBase(BaseModel):
    name: str
    category: str


class IngredientCreate(IngredientBase):
    pass


class Ingredient(IngredientBase):
    id: int

    class Config:
        from_attributes = True

# -------------------------
# PRICES SCHEMAS
# -------------------------
class UserPriceBase(BaseModel):
    store_name: str
    store_location: str | None = None
    product_name: str
    upc: str | None = None
    price: float
    currency: str = "USD"
    size_raw: str | None = None
    unit_amount: float | None = None
    unit_type: str | None = None


class UserPriceCreate(UserPriceBase):
    pass


class UserPrice(UserPriceBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True

