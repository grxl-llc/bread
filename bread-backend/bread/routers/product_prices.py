from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create a product price entry
# ------------------------------------------------------------

@router.post("/", response_model=schemas.ProductPriceRead)
def create_product_price(
    price: schemas.ProductPriceCreate,
    db: Session = Depends(get_db)
):
    # Ensure store exists
    store = db.query(models.Store).filter(models.Store.id == price.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    # Ensure product exists
    product = db.query(models.Product).filter(models.Product.id == price.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Ensure ingredient exists
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == price.ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    new_price = models.ProductPrice(
        store_id=price.store_id,
        product_id=price.product_id,
        ingredient_id=price.ingredient_id,
        zip_code=price.zip_code,
        price=price.price,
        sale_price=price.sale_price,
        currency=price.currency,
        sale_start=price.sale_start,
        sale_end=price.sale_end,
    )

    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    return new_price


# ------------------------------------------------------------
# List all product prices
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.ProductPriceRead])
def list_product_prices(
    db: Session = Depends(get_db),
    zip_code: Optional[str] = None
):
    query = db.query(models.ProductPrice)
    if zip_code:
        query = query.filter(models.ProductPrice.zip_code == zip_code)
    return query.all()


# ------------------------------------------------------------
# Get product price by ID
# ------------------------------------------------------------

@router.get("/{price_id}", response_model=schemas.ProductPriceRead)
def get_product_price(
    price_id: int,
    db: Session = Depends(get_db)
):
    price = db.query(models.ProductPrice).filter(models.ProductPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Product price not found")
    return price


# ------------------------------------------------------------
# Update product price
# ------------------------------------------------------------

@router.put("/{price_id}", response_model=schemas.ProductPriceRead)
def update_product_price(
    price_id: int,
    price: schemas.ProductPriceCreate,
    db: Session = Depends(get_db)
):
    db_price = db.query(models.ProductPrice).filter(models.ProductPrice.id == price_id).first()
    if not db_price:
        raise HTTPException(status_code=404, detail="Product price not found")

    db_price.store_id = price.store_id
    db_price.product_id = price.product_id
    db_price.ingredient_id = price.ingredient_id
    db_price.zip_code = price.zip_code
    db_price.price = price.price
    db_price.sale_price = price.sale_price
    db_price.currency = price.currency
    db_price.sale_start = price.sale_start
    db_price.sale_end = price.sale_end

    db.commit()
    db.refresh(db_price)
    return db_price


# ------------------------------------------------------------
# Delete product price
# ------------------------------------------------------------

@router.delete("/{price_id}")
def delete_product_price(
    price_id: int,
    db: Session = Depends(get_db)
):
    price = db.query(models.ProductPrice).filter(models.ProductPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="Product price not found")

    db.delete(price)
    db.commit()
    return {"detail": "Product price deleted"}
