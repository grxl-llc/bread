from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

# NEW: pricing engine import
from bread.services.pricing_engine import resolve_best_price

router = APIRouter()


# ------------------------------------------------------------
# Create ingredient
# ------------------------------------------------------------

@router.post("/", response_model=schemas.IngredientRead)
def create_ingredient(
    ingredient: schemas.IngredientCreate,
    db: Session = Depends(get_db)
):
    existing = (
        db.query(models.Ingredient)
        .filter(models.Ingredient.name == ingredient.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Ingredient already exists")

    new_ing = models.Ingredient(
        name=ingredient.name,
        category=ingredient.category
    )
    db.add(new_ing)
    db.commit()
    db.refresh(new_ing)
    return new_ing


# ------------------------------------------------------------
# List ingredients
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.IngredientRead])
def list_ingredients(db: Session = Depends(get_db)):
    return db.query(models.Ingredient).all()


# ------------------------------------------------------------
# Get ingredient by ID
# ------------------------------------------------------------

@router.get("/{ingredient_id}", response_model=schemas.IngredientRead)
def get_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db)
):
    ing = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    return ing


# ------------------------------------------------------------
# Update ingredient
# ------------------------------------------------------------

@router.put("/{ingredient_id}", response_model=schemas.IngredientRead)
def update_ingredient(
    ingredient_id: int,
    ingredient: schemas.IngredientCreate,
    db: Session = Depends(get_db)
):
    db_ing = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not db_ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db_ing.name = ingredient.name
    db_ing.category = ingredient.category

    db.commit()
    db.refresh(db_ing)
    return db_ing


# ------------------------------------------------------------
# Delete ingredient
# ------------------------------------------------------------

@router.delete("/{ingredient_id}")
def delete_ingredient(
    ingredient_id: int,
    db: Session = Depends(get_db)
):
    ing = db.query(models.Ingredient).filter(models.Ingredient.id == ingredient_id).first()
    if not ing:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    db.delete(ing)
    db.commit()
    return {"detail": "Ingredient deleted"}


# ------------------------------------------------------------
# NEW: Cheapest price endpoint (confidence‑weighted)
# ------------------------------------------------------------

@router.get("/{ingredient_id}/cheapest")
def get_cheapest_price(
    ingredient_id: int,
    zip_code: str,
    db: Session = Depends(get_db)
):
    best = resolve_best_price(db, ingredient_id, zip_code)

    if not best:
        return {"message": "No prices available"}

    return {
        "price": best.price,
        "store_id": best.store_id,
        "source": best.source,
        "confidence": best.confidence,
        "is_true_price": bool(best.is_true_price),
        "last_updated": best.last_updated,
    }
