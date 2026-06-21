from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.services.basket_search import basket_search_service

router = APIRouter(prefix="/basket", tags=["Basket"])


@router.get("/search")
async def basket_search(query: str, zip_code: str = "27576", limit: int = 10,
                        current_user: User = Depends(get_current_user)):
    return await basket_search_service(query, zip_code, limit)
