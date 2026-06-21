from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.ingredient import Ingredient, IngredientCreate

router = APIRouter(
    prefix="/ingredients",
    tags=["Ingredients"]
)

@router.get("/", response_model=list[Ingredient])
def list_ingredients(db: Session = Depends(get_db)):
    ingredients = db.query(models.Ingredient).all()
    return ingredients

@router.get("/{ingredient_id}", response_model=Ingredient)
def get_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ingredient

@router.post("/", response_model=Ingredient)
def create_ingredient(ingredient: IngredientCreate, db: Session = Depends(get_db)):
    new_ingredient = models.Ingredient(
        name=ingredient.name,
        category=ingredient.category
    )
    db.add(new_ingredient)
    db.commit()
    db.refresh(new_ingredient)
    return new_ingredient
