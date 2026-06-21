from pydantic import BaseModel
from typing import Optional


class HouseholdMemberBase(BaseModel):
    name: str
    age: Optional[int] = None
    relationship: Optional[str] = None


class HouseholdMemberCreate(HouseholdMemberBase):
    pass


class HouseholdMember(HouseholdMemberBase):
    id: int

    class Config:
        from_attributes = True  # Pydantic v2 replacement for orm_mode
