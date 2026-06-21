from pydantic import BaseModel
from typing import List, Optional


class NormalizedProduct(BaseModel):
    product_id: Optional[str]
    upc: Optional[str]
    name: Optional[str]
    brand: Optional[str]
    size: Optional[str]
    categories: Optional[list]
    image_url: Optional[str]
    description: Optional[str]

    regular_price: Optional[float]
    sale_price: Optional[float]
    price_per_unit: Optional[float]

    unit_amount: Optional[float]
    unit_type: Optional[str]

    nutrition_preview: Optional[dict]


class SearchResponse(BaseModel):
    store_id: str
    results: List[NormalizedProduct]
