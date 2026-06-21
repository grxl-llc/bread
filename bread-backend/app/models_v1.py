from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    ForeignKey,
    DateTime
)
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True)

    # Comma-separated list of preferred store names (e.g. "Walmart,Target")
    preferred_stores = Column(String, nullable=True)

    recipes = relationship("Recipe", back_populates="owner")
    pantry_items = relationship("PantryItem", back_populates="user")
    zipcode = Column(String, nullable=True)


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)

    product_prices = relationship("ProductPrice", back_populates="store")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

    # Generic ingredient; brand/size/image live on ProductPrice per store
    recipe_ingredients = relationship("RecipeIngredient", back_populates="ingredient")
    product_prices = relationship("ProductPrice", back_populates="ingredient")
    pantry_items = relationship("PantryItem", back_populates="ingredient")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))
    is_public = Column(Integer, default=0)

    owner = relationship("User", back_populates="recipes")
    recipe_ingredients = relationship(
        "RecipeIngredient",
        back_populates="recipe",
        cascade="all, delete-orphan"
    )


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

    recipe = relationship("Recipe", back_populates="recipe_ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_ingredients")


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(Integer, primary_key=True, index=True)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    store_id = Column(Integer, ForeignKey("stores.id"))

    brand = Column(String, index=True)
    size = Column(String, index=True)
    image_url = Column(String, nullable=True)

    price = Column(Float, nullable=True)

    zipcode = Column(String, index=True)  

    external_product_id = Column(String, nullable=True)
    store_api_source = Column(String, nullable=True)
    price_last_checked = Column(DateTime, nullable=True)

    ingredient = relationship("Ingredient", back_populates="product_prices")
    store = relationship("Store", back_populates="product_prices")



class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))

    quantity = Column(Float, nullable=False)
    unit = Column(String, nullable=False)

    user = relationship("User", back_populates="pantry_items")
    ingredient = relationship("Ingredient", back_populates="pantry_items")
    household_members = relationship("HouseholdMember", back_populates="user", cascade="all, delete-orphan")

class MealPlan(Base):
    __tablename__ = "meal_plans"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    week = Column(String, index=True)  # e.g. "2026-02-03"

    user = relationship("User")
    items = relationship("MealPlanItem", back_populates="meal_plan", cascade="all, delete-orphan")


class MealPlanItem(Base):
    __tablename__ = "meal_plan_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_plan_id = Column(Integer, ForeignKey("meal_plans.id"))
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    servings = Column(Integer, nullable=False)

    meal_plan = relationship("MealPlan", back_populates="items")
    recipe = relationship("Recipe")

class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))

    name = Column(String, nullable=False)
    age_group = Column(String, nullable=True)
    default_portions = Column(String, nullable=True)  # store JSON as string for now
    dietary_preferences = Column(String, nullable=True)
    allergies = Column(String, nullable=True)

    user = relationship("User", back_populates="household_members")

class UserPrice(Base):
    __tablename__ = "user_prices"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    store_name = Column(String, index=True, nullable=False)
    store_location = Column(String, nullable=True)  # city/zip/etc.

    product_name = Column(String, index=True, nullable=False)
    upc = Column(String, index=True, nullable=True)

    price = Column(Float, nullable=False)
    currency = Column(String, default="USD")

    size_raw = Column(String, nullable=True)        # "16 oz", "2 lb", etc.
    unit_amount = Column(Float, nullable=True)      # normalized amount
    unit_type = Column(String, nullable=True)       # "g", "ml", "count"

    source = Column(String, default="user")         # "user"
    created_at = Column(DateTime, default=datetime.utcnow)
