import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, Float, DateTime, Text, Date
from sqlalchemy.dialects.sqlite import JSON
from app.database import Base


def gen_uuid():
    return str(uuid.uuid4())


class PantryItem(Base):
    __tablename__ = "pantry_items"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, index=True, nullable=False)  # user email
    name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    quantity = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    category = Column(String, nullable=True)
    barcode = Column(String, nullable=True)
    product_id = Column(String, nullable=True)   # Kroger/branded product reference for pricing
    expiry_date = Column(Date, nullable=True)
    image_url = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class GroceryList(Base):
    __tablename__ = "grocery_lists"

    id = Column(String, primary_key=True, default=gen_uuid)
    created_by = Column(String, index=True, nullable=False)  # user email
    name = Column(String, nullable=False)
    # items: [{name, quantity, unit, price, store, checked, image_url}]
    items = Column(JSON, default=list)
    total_cost = Column(Float, nullable=True)
    store = Column(String, nullable=True)
    status = Column(String, default="active")  # active, completed, archived
    created_date = Column(DateTime, default=datetime.utcnow, index=True)


class Ingredient(Base):
    __tablename__ = "ingredients"

    id = Column(String, primary_key=True, default=gen_uuid)
    name = Column(String, unique=True, index=True, nullable=False)
    normalized_name = Column(String, nullable=True, index=True)
    category = Column(String, nullable=True)
    created_date = Column(DateTime, default=datetime.utcnow)


class ProductPrice(Base):
    __tablename__ = "product_prices"

    id = Column(String, primary_key=True, default=gen_uuid)
    ingredient_id = Column(String, index=True, nullable=True)
    store_name = Column(String, index=True, nullable=False)
    store_location_id = Column(String, nullable=True)
    product_name = Column(String, nullable=False)
    brand = Column(String, nullable=True)
    size = Column(String, nullable=True)
    price = Column(Float, nullable=False)
    sale_price = Column(Float, nullable=True)
    unit_price = Column(Float, nullable=True)   # price per oz/lb/etc
    unit_type = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    product_url = Column(String, nullable=True)
    external_id = Column(String, nullable=True, index=True)
    zip_code = Column(String, nullable=True, index=True)
    source = Column(String, nullable=True)      # kroger_api, walmart_api, user_submitted
    confidence = Column(Float, default=0.9)
    last_updated = Column(DateTime, default=datetime.utcnow)
