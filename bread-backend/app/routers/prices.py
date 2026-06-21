from fastapi import APIRouter

router = APIRouter(
    prefix="/prices",
    tags=["Prices"]
)

@router.get("/")
def get_prices_root():
    return {"message": "Prices endpoint is active"}
