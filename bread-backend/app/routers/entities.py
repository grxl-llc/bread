"""
Generic entity router that mirrors Base44's entity interface exactly.

Supports:
  GET    /entities/{Entity}             → list / filter
  POST   /entities/{Entity}             → create
  GET    /entities/{Entity}/{id}        → get by id
  PUT    /entities/{Entity}/{id}        → update
  DELETE /entities/{Entity}/{id}        → delete

Query params for GET list:
  sort   - field name, prefix with "-" for descending (e.g. "-created_date")
  limit  - max results (default 50)
  offset - pagination offset (default 0)
  + any field=value pairs for filtering
"""

from datetime import datetime
from typing import Any, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from sqlalchemy.exc import IntegrityError

from app.database import get_db
from app.auth.dependencies import get_current_user, get_optional_user
from app.models import (
    User, Post, Comment, Like, Follow, Notification, Message,
    Tutorial, LiveSession, CreatorEarnings, SavedTutorial,
    Recipe, RecipeCollection, RecipeRating,
    PantryItem, GroceryList, Ingredient, ProductPrice,
    Ad, ApprovedAd, BrandSponsorship,
    Brand, BrandPartner, CreatorApplication, BrandApplication,
    AdAnalytics,
)

router = APIRouter(prefix="/entities", tags=["entities"])

# Map entity name → (model class, requires_auth, owner_field)
# owner_field: if set, GET list auto-filters to current user unless overridden
ENTITY_MAP = {
    "Post":                (Post,                False,  None),
    "Comment":             (Comment,             False,  None),
    "Like":                (Like,                True,   None),
    "Follow":              (Follow,              True,   None),
    "Notification":        (Notification,        True,   "user_email"),
    "Message":             (Message,             True,   None),
    "Tutorial":            (Tutorial,            False,  None),
    "LiveSession":         (LiveSession,         False,  None),
    "CreatorEarnings":     (CreatorEarnings,     True,   "creator_email"),
    "SavedTutorial":       (SavedTutorial,       True,   "user_email"),
    "Recipe":              (Recipe,              False,  None),
    "RecipeCollection":    (RecipeCollection,    True,   "created_by"),
    "PantryItem":          (PantryItem,          True,   "created_by"),
    "GroceryList":         (GroceryList,         True,   "created_by"),
    "Ingredient":          (Ingredient,          False,  None),
    "ProductPrice":        (ProductPrice,        False,  None),
    "User":                (User,                False,  None),
    # Ad pipeline
    "Ad":                  (Ad,                  False,  None),
    "AdvertiserRequest":   (Ad,                  False,  None),   # frontend alias for Ad
    "ApprovedAd":          (ApprovedAd,          False,  None),
    "BrandSponsorship":    (BrandSponsorship,    False,  None),
    "Brand":               (Brand,               False,  None),
    "BrandPartner":        (BrandPartner,        False,  None),
    "CreatorApplication":  (CreatorApplication,  True,   "user_email"),
    "BrandApplication":    (BrandApplication,    False,  None),
    # Analytics
    "AdAnalytics":         (AdAnalytics,         False,  None),
    # Ratings (auth required — see recipe_ratings router for the rate endpoint)
    "RecipeRating":        (RecipeRating,        True,   None),
}

# Fields that should never be returned for User entity (security)
USER_PRIVATE_FIELDS = {"password_hash", "google_id", "apple_id"}


def model_to_dict(obj: Any, entity_name: str = "") -> dict:
    result = {}
    for col in obj.__table__.columns:
        val = getattr(obj, col.name)
        if entity_name == "User" and col.name in USER_PRIVATE_FIELDS:
            continue
        if isinstance(val, datetime):
            result[col.name] = val.isoformat()
        else:
            result[col.name] = val
    return result


def get_entity_meta(entity_name: str):
    meta = ENTITY_MAP.get(entity_name)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Unknown entity: {entity_name}")
    return meta


# ── LIST / FILTER ─────────────────────────────────────────────────────────────

@router.get("/{entity_name}")
def list_entities(
    entity_name: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    model, requires_auth, owner_field = get_entity_meta(entity_name)

    if requires_auth and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    query = db.query(model)

    # Parse query params
    params = dict(request.query_params)
    sort_param = params.pop("sort", "-created_date")
    limit = int(params.pop("limit", 50))
    offset = int(params.pop("offset", 0))

    # Auto-scope owner-bound entities to current user
    # (only if the caller didn't explicitly pass the owner field)
    if owner_field and current_user and owner_field not in params:
        owner_value = current_user.email if owner_field in ("user_email", "creator_email", "created_by") else current_user.id
        query = query.filter(getattr(model, owner_field) == owner_value)

    # Apply caller-supplied filters
    for field, value in params.items():
        if not hasattr(model, field):
            continue
        col = getattr(model, field)
        # Handle boolean strings
        if value.lower() == "true":
            query = query.filter(col == True)
        elif value.lower() == "false":
            query = query.filter(col == False)
        else:
            query = query.filter(col == value)

    # Sorting
    if sort_param.startswith("-"):
        field_name = sort_param[1:]
        if hasattr(model, field_name):
            query = query.order_by(desc(getattr(model, field_name)))
    else:
        if hasattr(model, sort_param):
            query = query.order_by(asc(getattr(model, sort_param)))

    results = query.offset(offset).limit(limit).all()
    return [model_to_dict(r, entity_name) for r in results]


# ── CREATE ────────────────────────────────────────────────────────────────────

@router.post("/{entity_name}")
def create_entity(
    entity_name: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    model, requires_auth, owner_field = get_entity_meta(entity_name)

    if requires_auth and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    # Auto-set created_by / user_email / creator_email from token
    if current_user:
        for auto_field in ("created_by", "user_email", "creator_email"):
            if hasattr(model, auto_field) and auto_field not in body:
                body[auto_field] = current_user.email

    # Strip unknown fields
    valid = {c.name for c in model.__table__.columns}
    filtered = {k: v for k, v in body.items() if k in valid and k != "id"}

    obj = model(**filtered)
    db.add(obj)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Record already exists (duplicate)")
    db.refresh(obj)
    return model_to_dict(obj, entity_name)


# ── GET BY ID ─────────────────────────────────────────────────────────────────

@router.get("/{entity_name}/{entity_id}")
def get_entity(
    entity_name: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    model, requires_auth, _ = get_entity_meta(entity_name)

    if requires_auth and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    obj = db.query(model).filter(model.id == entity_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return model_to_dict(obj, entity_name)


# ── UPDATE ────────────────────────────────────────────────────────────────────

@router.put("/{entity_name}/{entity_id}")
def update_entity(
    entity_name: str,
    entity_id: str,
    body: dict,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    model, requires_auth, _ = get_entity_meta(entity_name)

    if requires_auth and not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    obj = db.query(model).filter(model.id == entity_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")

    valid = {c.name for c in model.__table__.columns}
    for key, value in body.items():
        if key in valid and key != "id":
            setattr(obj, key, value)

    db.commit()
    db.refresh(obj)
    return model_to_dict(obj, entity_name)


# ── DELETE ────────────────────────────────────────────────────────────────────

@router.delete("/{entity_name}/{entity_id}")
def delete_entity(
    entity_name: str,
    entity_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    model, _, _ = get_entity_meta(entity_name)

    obj = db.query(model).filter(model.id == entity_id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(obj)
    db.commit()
    return {"ok": True}
