from pydantic import BaseModel
from typing import Optional


class SearchRequest(BaseModel):
    query: str
    limit: int = 10
    store_id: Optional[str] = None
    user_zip: str = "27576"
    radius: int = 35
