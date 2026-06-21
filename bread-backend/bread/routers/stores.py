from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create store
# ------------------------------------------------------------

@router.post("/", response_model=schemas.StoreRead)
def create_store(
    store: schemas.StoreCreate,
    db: Session = Depends(get_db)
):
    existing = (
        db.query(models.Store)
        .filter(models.Store.name == store.name, models.Store.zip_code == store.zip_code)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Store already exists in this ZIP")

    new_store = models.Store(
        name=store.name,
        chain=store.chain,
        zip_code=store.zip_code
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store


# ------------------------------------------------------------
# List all stores
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.StoreRead])
def list_stores(db: Session = Depends(get_db)):
    return db.query(models.Store).all()


# ------------------------------------------------------------
# Get store by ID
# ------------------------------------------------------------

@router.get("/{store_id}", response_model=schemas.StoreRead)
def get_store(
    store_id: int,
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    return store


# ------------------------------------------------------------
# Update store
# ------------------------------------------------------------

@router.put("/{store_id}", response_model=schemas.StoreRead)
def update_store(
    store_id: int,
    store: schemas.StoreCreate,
    db: Session = Depends(get_db)
):
    db_store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not db_store:
        raise HTTPException(status_code=404, detail="Store not found")

    db_store.name = store.name
    db_store.chain = store.chain
    db_store.zip_code = store.zip_code

    db.commit()
    db.refresh(db_store)
    return db_store


# ------------------------------------------------------------
# Delete store
# ------------------------------------------------------------

@router.delete("/{store_id}")
def delete_store(
    store_id: int,
    db: Session = Depends(get_db)
):
    store = db.query(models.Store).filter(models.Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")

    db.delete(store)
    db.commit()
    return {"detail": "Store deleted"}

@router.get("/by-zip/{zip_code}")
def get_stores_by_zip(zip_code: str, db: Session = Depends(get_db)):
    return db.query(models.Store).filter(models.Store.zip_code == zip_code).all()
