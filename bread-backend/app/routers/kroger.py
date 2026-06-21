from fastapi import APIRouter, Depends
from app.auth.dependencies import get_current_user
from app.models.user import User

from app.schemas.search import SearchRequest
from app.schemas.recipe_cost_request import RecipeCostRequest
from app.schemas.compare_response import CompareResponse

from app.services.search import search_products_service
from app.services.recipe_cost import calculate_recipe_cost_service
from app.services.compare import compare_stores_service

from app.integrations.kroger import get_kroger_token, fetch_kroger_stores

router = APIRouter(prefix="/kroger", tags=["Kroger"])


@router.get("/auth-test")
async def kroger_auth_test(current_user: User = Depends(get_current_user)):
    token = await get_kroger_token()
    return {"token_preview": token[:12] + "...", "status": "OK"}


@router.get("/stores")
async def kroger_stores(zip_code: str = "27576", radius: int = 35,
                        current_user: User = Depends(get_current_user)):
    return await fetch_kroger_stores(zip_code, radius)


@router.post("/search")
async def kroger_search(payload: SearchRequest,
                        current_user: User = Depends(get_current_user)):
    return await search_products_service(
        query=payload.query,
        limit=payload.limit,
        store_id=payload.store_id,
        user_zip=payload.user_zip,
        radius=payload.radius,
    )


@router.post("/recipe/cost")
async def calculate_recipe_cost(payload: RecipeCostRequest,
                                current_user: User = Depends(get_current_user)):
    return await calculate_recipe_cost_service(payload.dict())


@router.post("/recipe/compare", response_model=CompareResponse)
async def compare_stores(payload: RecipeCostRequest,
                         current_user: User = Depends(get_current_user)):
    return await compare_stores_service(payload.dict())
