import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Integer, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, index=True, nullable=False)  # user email
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    instructions = Column(JSON, default=list)   # list of step strings
    ingredients = Column(JSON, default=list)    # [{name, quantity, unit}]
    servings = Column(Integer, nullable=True)
    prep_time = Column(Integer, nullable=True)  # minutes
    cook_time = Column(Integer, nullable=True)  # minutes
    cuisine = Column(String, nullable=True)
    difficulty = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    image_url = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    nutrition = Column(JSON, nullable=True)     # {calories, protein, carbs, fat}
    tags = Column(JSON, default=list)
    collection_id = Column(String, nullable=True, index=True)
    # Ratings — denormalized for fast reads
    rating_sum = Column(Integer, default=0)
    rating_count = Column(Integer, default=0)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class RecipeCollection(Base):
    __tablename__ = "recipe_collections"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, index=True, nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    cover_image = Column(String, nullable=True)
    is_public = Column(Boolean, default=False)
    created_date = Column(DateTime, default=datetime.utcnow)


class RecipeRating(Base):
    """
    One row per (recipe, user) pair.
    Unique constraint prevents a user from rating the same recipe twice.
    When a user changes their rating, the old row is updated (upsert).
    """
    __tablename__ = "recipe_ratings"

    id = Column(String, primary_key=True, default=gen_uuid)
    recipe_id = Column(String, nullable=False, index=True)
    rated_by = Column(String, nullable=False, index=True)  # user email — login required
    rating = Column(Integer, nullable=False)               # 1–5
    created_date = Column(DateTime, default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("recipe_id", "rated_by", name="uq_recipe_rating_per_user"),
    )
