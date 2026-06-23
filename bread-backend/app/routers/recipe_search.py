"""
Recipe search and rating endpoints.

GET  /api/recipes/search?q=<term>    — full-text search across public recipes
POST /api/recipes/{id}/rate          — rate a recipe (login required)
GET  /api/recipes/{id}/my-rating     — get the current user's rating for a recipe
"""

from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel

from app.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user
from app.models.user import User
from app.models.recipe import Recipe, RecipeRating

router = APIRouter(prefix="/recipes", tags=["recipes"])

# ── Schemas ───────────────────────────────────────────────────────────────────

class RateRequest(BaseModel):
    rating: int  # 1–5


# ── Helpers ───────────────────────────────────────────────────────────────────

def recipe_to_dict(r: Recipe) -> dict:
    avg = round(r.rating_sum / r.rating_count, 2) if r.rating_count else None
    return {
        "id": r.id,
        "created_by": r.created_by,
        "title": r.title,
        "description": r.description,
        "instructions": r.instructions,
        "ingredients": r.ingredients,
        "servings": r.servings,
        "prep_time": r.prep_time,
        "cook_time": r.cook_time,
        "cuisine": r.cuisine,
        "difficulty": r.difficulty,
        "is_public": r.is_public,
        "image_url": r.image_url,
        "source_url": r.source_url,
        "nutrition": r.nutrition,
        "tags": r.tags,
        "collection_id": r.collection_id,
        "rating_sum": r.rating_sum,
        "rating_count": r.rating_count,
        "avg_rating": avg,
        "created_date": r.created_date.isoformat() if r.created_date else None,
    }


# ── Search ────────────────────────────────────────────────────────────────────

@router.get("/search")
def search_recipes(
    q: str = Query("", description="Search term"),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Search public recipes by title, description, or tags.
    No authentication required. Only is_public=True recipes are returned.
    The soft paywall (FREE_RECIPE_VIEWS threshold) is enforced client-side.
    """
    query = db.query(Recipe).filter(Recipe.is_public == True)  # noqa: E712

    term = q.strip()
    if term:
        like = f"%{term}%"
        query = query.filter(
            or_(
                Recipe.title.ilike(like),
                Recipe.description.ilike(like),
                Recipe.cuisine.ilike(like),
                Recipe.difficulty.ilike(like),
            )
        )

    recipes = query.order_by(Recipe.created_date.desc()).limit(limit).all()
    return {
        "results": [recipe_to_dict(r) for r in recipes],
        "total": len(recipes),
        "q": term,
    }


# ── Ratings ───────────────────────────────────────────────────────────────────

@router.post("/{recipe_id}/rate")
def rate_recipe(
    recipe_id: str,
    body: RateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),  # login required
):
    """
    Rate a recipe 1–5. Login required for all ratings.
    Private recipes can only be rated by their owner.
    Public recipes can be rated by any authenticated user.
    Submitting a second rating from the same account updates (replaces) the first.
    """
    if not (1 <= body.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5.")

    recipe = db.query(Recipe).filter(Recipe.id == recipe_id).first()
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found.")

    # Private recipe: only the owner can rate (it's a personal note).
    if not recipe.is_public and recipe.created_by != current_user.email:
        raise HTTPException(status_code=403, detail="You can only rate your own private recipes.")

    # Upsert: find existing rating from this user for this recipe.
    existing = (
        db.query(RecipeRating)
        .filter(RecipeRating.recipe_id == recipe_id, RecipeRating.rated_by == current_user.email)
        .first()
    )

    if existing:
        old_rating = existing.rating
        existing.rating = body.rating
        # Adjust the recipe's running totals.
        recipe.rating_sum = (recipe.rating_sum or 0) - old_rating + body.rating
        # rating_count stays the same (same user, updating their vote)
    else:
        db.add(RecipeRating(
            recipe_id=recipe_id,
            rated_by=current_user.email,
            rating=body.rating,
        ))
        recipe.rating_sum = (recipe.rating_sum or 0) + body.rating
        recipe.rating_count = (recipe.rating_count or 0) + 1

    db.commit()
    db.refresh(recipe)

    avg = round(recipe.rating_sum / recipe.rating_count, 2) if recipe.rating_count else None
    return {
        "ok": True,
        "avg_rating": avg,
        "rating_count": recipe.rating_count,
        "your_rating": body.rating,
    }


@router.get("/{recipe_id}/my-rating")
def get_my_rating(
    recipe_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the current user's rating for a given recipe, or null if not yet rated."""
    row = (
        db.query(RecipeRating)
        .filter(RecipeRating.recipe_id == recipe_id, RecipeRating.rated_by == current_user.email)
        .first()
    )
    return {"rating": row.rating if row else None}
