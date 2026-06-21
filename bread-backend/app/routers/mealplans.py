from fastapi import APIRouter

router = APIRouter(
    prefix="/mealplans",
    tags=["Meal Plans"]
)

@router.get("/")
def mealplans_root():
    return {"message": "Meal plans endpoint is active"}
