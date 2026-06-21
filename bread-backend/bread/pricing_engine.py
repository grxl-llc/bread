from datetime import datetime
from sqlalchemy.orm import Session
from typing import List, Optional, Dict

from . import models


# ------------------------------------------------------------
# Core helpers
# ------------------------------------------------------------

def get_active_price(product_price: models.ProductPrice) -> float:
    """
    Return sale price if sale is active, otherwise regular price.
    """
    now = datetime.utcnow()

    if (
        product_price.sale_price is not None
        and product_price.sale_start is not None
        and product_price.sale_end is not None
        and product_price.sale_start <= now <= product_price.sale_end
    ):
        return product_price.sale_price

    return product_price.price


# ------------------------------------------------------------
# Ingredient → ProductPrice resolution
# ------------------------------------------------------------

def get_prices_for_ingredient(
    db: Session,
    ingredient_id: int,
    zip_code: Optional[str] = None
) -> List[models.ProductPrice]:
    """
    Return all product prices for an ingredient, optionally filtered by ZIP.
    """
    query = db.query(models.ProductPrice).filter(
        models.ProductPrice.ingredient_id == ingredient_id
    )

    if zip_code:
        query = query.filter(models.ProductPrice.zip_code == zip_code)

    return query.all()


def get_cheapest_price_for_ingredient(
    db: Session,
    ingredient_id: int,
    zip_code: Optional[str] = None
) -> Optional[models.ProductPrice]:
    """
    Return the single cheapest ProductPrice for an ingredient.
    """
    prices = get_prices_for_ingredient(db, ingredient_id, zip_code)

    if not prices:
        return None

    return min(prices, key=lambda p: get_active_price(p))


# ------------------------------------------------------------
# Multi-store optimization
# ------------------------------------------------------------

def optimize_grocery_list(
    db: Session,
    ingredient_ids: List[int],
    zip_code: Optional[str] = None
) -> Dict[int, models.ProductPrice]:
    """
    For each ingredient, pick the cheapest store/product combination.
    Returns a dict: {ingredient_id: ProductPrice}
    """
    result = {}

    for ingredient_id in ingredient_ids:
        cheapest = get_cheapest_price_for_ingredient(
            db=db,
            ingredient_id=ingredient_id,
            zip_code=zip_code
        )
        result[ingredient_id] = cheapest

    return result


# ------------------------------------------------------------
# Recipe cost calculation
# ------------------------------------------------------------

def calculate_recipe_cost(
    db: Session,
    recipe: models.Recipe,
    zip_code: Optional[str] = None,
    pantry_items: Optional[Dict[int, float]] = None
) -> Dict[str, float]:
    """
    Calculate total cost of a recipe.
    pantry_items: {ingredient_id: quantity_available}
    """
    total_cost = 0.0
    missing_cost = 0.0

    for ri in recipe.ingredients:
        ingredient_id = ri.ingredient_id
        quantity_needed = ri.quantity

        # Pantry logic
        if pantry_items and ingredient_id in pantry_items:
            available = pantry_items[ingredient_id]
            if available >= quantity_needed:
                continue  # fully covered by pantry
            else:
                quantity_needed -= available  # partially covered

        # Get cheapest price
        cheapest = get_cheapest_price_for_ingredient(
            db=db,
            ingredient_id=ingredient_id,
            zip_code=zip_code
        )

        if not cheapest:
            continue  # no price data available

        unit_price = get_active_price(cheapest)
        total_cost += unit_price * quantity_needed
        missing_cost += unit_price * quantity_needed

    return {
        "total_cost": round(total_cost, 2),
        "missing_cost": round(missing_cost, 2),
    }


# ------------------------------------------------------------
# Household-aware scaling (optional hook)
# ------------------------------------------------------------

def scale_recipe_for_household(
    recipe: models.Recipe,
    household_size: int
) -> int:
    """
    Return the scaled servings needed for a household.
    """
    if not recipe.servings:
        return household_size

    return max(1, household_size)
