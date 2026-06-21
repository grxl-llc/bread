from pydantic import BaseModel
from typing import List, Optional


class StoreComparison(BaseModel):
    store: str
    total_cost: Optional[float] = None
    details: Optional[dict] = None
    error: Optional[str] = None


class CompareResponse(BaseModel):
    comparison: List[StoreComparison]
