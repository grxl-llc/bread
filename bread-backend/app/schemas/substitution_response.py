from pydantic import BaseModel
from typing import List, Optional


class SubstitutionResponse(BaseModel):
    ingredient: str
    substitutions: List[dict]
