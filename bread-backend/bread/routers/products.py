from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create product
# ------------------------------------------------------------

@router.post("/", response_model=schemas.ProductRead)
def create_product(
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    new_product = models.Product(
        name=product.name,
        brand=product.brand,
        size_description=product.size_description
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product


# ------------------------------------------------------------
# List all products
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.ProductRead])
def list_products(db: Session = Depends(get_db)):
    return db.query(models.Product).all()


# ------------------------------------------------------------
# Get product by ID
# ------------------------------------------------------------

@router.get("/{product_id}", response_model=schemas.ProductRead)
def get_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


# ------------------------------------------------------------
# Update product
# ------------------------------------------------------------

@router.put("/{product_id}", response_model=schemas.ProductRead)
def update_product(
    product_id: int,
    product: schemas.ProductCreate,
    db: Session = Depends(get_db)
):
    db_product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not db_product:
        raise HTTPException(status_code=404, detail="Product not found")

    db_product.name = product.name
    db_product.brand = product.brand
    db_product.size_description = product.size_description

    db.commit()
    db.refresh(db_product)
    return db_product


# ------------------------------------------------------------
# Delete product
# ------------------------------------------------------------

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(models.Product).filter(models.Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    db.delete(product)
    db.commit()
    return {"detail": "Product deleted"}

@router.get("/by-ingredient/{ingredient_id}")
def get_products_by_ingredient(ingredient_id: int, db: Session = Depends(get_db)):
    return db.query(models.Product).filter(
        models.Product.id.in_(
            db.query(models.ProductPrice.product_id)
            .filter(models.ProductPrice.ingredient_id == ingredient_id)
        )
    ).all()
