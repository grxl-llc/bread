import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from bread.database import get_db
from bread import models, schemas
from bread.pricing_engine import (
    get_prices_for_ingredient,
    get_cheapest_price_for_ingredient,
    optimize_grocery_list,
    calculate_recipe_cost,
)

router = APIRouter()


# ------------------------------------------------------------
# Get all prices for an ingredient
# ------------------------------------------------------------

@router.get("/ingredient/{ingredient_id}/prices", response_model=List[schemas.ProductPriceRead])
def list_prices_for_ingredient(
    ingredient_id: int,
    zip_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    prices = get_prices_for_ingredient(db, ingredient_id, zip_code)
    return prices


# ------------------------------------------------------------
# Get cheapest price for an ingredient
# ------------------------------------------------------------

@router.get("/ingredient/{ingredient_id}/cheapest", response_model=Optional[schemas.ProductPriceRead])
def cheapest_price_for_ingredient(
    ingredient_id: int,
    zip_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    cheapest = get_cheapest_price_for_ingredient(db, ingredient_id, zip_code)
    return cheapest


# ------------------------------------------------------------
# Optimize grocery list
# ------------------------------------------------------------

@router.post("/optimize", response_model=Dict[int, Optional[schemas.ProductPriceRead]])
def optimize_list(
    ingredient_ids: List[int],
    zip_code: Optional[str] = None,
    db: Session = Depends(get_db)
):
    result = optimize_grocery_list(db, ingredient_ids, zip_code)
    return result


# ------------------------------------------------------------
# Calculate recipe cost
# ------------------------------------------------------------

@router.get("/recipe/{recipe_id}/cost")
def recipe_cost(recipe_id: int, zip_code: str, db: Session = Depends(get_db)):
    recipe = db.query(models.Recipe).filter(models.Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")

    ingredients = (
        db.query(models.RecipeIngredient)
        .filter(models.RecipeIngredient.recipe_id == recipe_id)
        .all()
    )

    total_cost = 0
    missing_cost = 0

    for ing in ingredients:
        price_entry = (
            db.query(models.ProductPrice)
            .filter(models.ProductPrice.ingredient_id == ing.ingredient_id)
            .filter(models.ProductPrice.zip_code == zip_code)
            .order_by(models.ProductPrice.price.asc())
            .first()
        )

        if price_entry:
            total_cost += price_entry.price * ing.quantity
        else:
            # treat missing price as missing cost
            missing_cost += ing.quantity * 3.49  # or 0, depending on your design

    return {
        "total_cost": round(total_cost, 2),
        "missing_cost": round(missing_cost, 2)
    }
@router.post("/ingest")
def ingest_price(data: schemas.PriceIngest, db: Session = Depends(get_db)):
    # 1. Create or reuse a PriceSource entry
    price_source = models.PriceSource(
        source_type=data.source_type,
        confidence_score=data.confidence_score,
        raw_payload=json.dumps(data.raw_payload) if data.raw_payload else None
    )
    db.add(price_source)
    db.commit()
    db.refresh(price_source)

    # 2. Create the ProductPrice entry
    price_entry = models.ProductPrice(
        ingredient_id=data.ingredient_id,
        product_id=data.product_id,
        store_id=data.store_id,
        zip_code=data.zip_code,
        price=data.price,
        sale_price=data.sale_price,
        currency=data.currency,
        price_source_id=price_source.id,
        last_updated=datetime.utcnow()
    )

    db.add(price_entry)
    db.commit()
    db.refresh(price_entry)

    return {
        "message": "Price ingested successfully",
        "price_id": price_entry.id,
        "source_id": price_source.id
    }
