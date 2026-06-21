from pydantic import BaseModel
from typing import Optional


class UserPriceBase(BaseModel):
    user_id: int
    product_id: str
    price: float


class UserPriceCreate(UserPriceBase):
    pass


class UserPrice(UserPriceBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
