from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from bread.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    name = Column(String)
    zip_code = Column(String)
    default_store_id = Column(Integer, ForeignKey("stores.id"))

    default_store = relationship("Store")
    households = relationship("Household", back_populates="owner")


class Store(Base):
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    chain = Column(String)
    zip_code = Column(String)

    product_prices = relationship("ProductPrice", back_populates="store")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    brand = Column(String)
    size_description = Column(String)
    external_id = Column(String, nullable=True, index=True)

    product_prices = relationship("ProductPrice", back_populates="product")


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    category = Column(String)

    recipe_links = relationship("RecipeIngredient", back_populates="ingredient")
    product_prices = relationship("ProductPrice", back_populates="ingredient")


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"), nullable=False)
    zip_code = Column(String, nullable=False)

    price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=True)
    currency = Column(String, default="USD")
    sale_start = Column(DateTime, nullable=True)
    sale_end = Column(DateTime, nullable=True)

    # unified source metadata
    source = Column(String, nullable=True)
    confidence = Column(Float, default=0.5)
    is_true_price = Column(Integer, default=1)
    raw_payload = Column(String, nullable=True)

    # ingestion timestamp
    last_updated = Column(DateTime, default=datetime.utcnow)

    # ⭐ NEW: proper FK to PriceSource
    source_id = Column(Integer, ForeignKey("price_sources.id"), nullable=True)

    # Relationships
    store = relationship("Store", back_populates="product_prices")
    product = relationship("Product", back_populates="product_prices")
    ingredient = relationship("Ingredient", back_populates="product_prices")

    # ⭐ NEW: relationship back to PriceSource
    price_source = relationship("PriceSource", back_populates="product_prices")


class PriceSource(Base):
    __tablename__ = "price_sources"

    id = Column(Integer, primary_key=True, index=True)
    source_type = Column(String, nullable=False)
    confidence_score = Column(Float, nullable=False, default=0.5)
    raw_payload = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # reverse relationship
    product_prices = relationship("ProductPrice", back_populates="price_source")


class Recipe(Base):
    __tablename__ = "recipes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    servings = Column(Integer)

    ingredients = relationship("RecipeIngredient", back_populates="recipe")


class RecipeIngredient(Base):
    __tablename__ = "recipe_ingredients"

    id = Column(Integer, primary_key=True, index=True)
    recipe_id = Column(Integer, ForeignKey("recipes.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    quantity = Column(Float)
    unit = Column(String)

    recipe = relationship("Recipe", back_populates="ingredients")
    ingredient = relationship("Ingredient", back_populates="recipe_links")


class Household(Base):
    __tablename__ = "households"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    owner_id = Column(Integer, ForeignKey("users.id"))

    owner = relationship("User", back_populates="households")
    members = relationship("HouseholdMember", back_populates="household")
    pantry_items = relationship("PantryItem", back_populates="household")


class HouseholdMember(Base):
    __tablename__ = "household_members"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    name = Column(String)
    age_group = Column(String)
    dietary_notes = Column(String)

    household = relationship("Household", back_populates="members")


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(Integer, primary_key=True, index=True)
    household_id = Column(Integer, ForeignKey("households.id"))
    ingredient_id = Column(Integer, ForeignKey("ingredients.id"))
    quantity = Column(Float)
    unit = Column(String)

    household = relationship("Household", back_populates="pantry_items")
    ingredient = relationship("Ingredient")
