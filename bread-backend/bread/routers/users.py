from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create user
# ------------------------------------------------------------

@router.post("/", response_model=schemas.UserRead)
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    existing = (
        db.query(models.User)
        .filter(models.User.email == user.email)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    new_user = models.User(
        email=user.email,
        name=user.name,
        zip_code=user.zip_code,
        default_store_id=user.default_store_id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


# ------------------------------------------------------------
# List all users
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.UserRead])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# ------------------------------------------------------------
# Get user by ID
# ------------------------------------------------------------

@router.get("/{user_id}", response_model=schemas.UserRead)
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


# ------------------------------------------------------------
# Update user
# ------------------------------------------------------------

@router.put("/{user_id}", response_model=schemas.UserRead)
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db)
):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.name is not None:
        db_user.name = user.name

    if user.zip_code is not None:
        db_user.zip_code = user.zip_code

    if user.default_store_id is not None:
        store = db.query(models.Store).filter(models.Store.id == user.default_store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail="Default store not found")
        db_user.default_store_id = user.default_store_id

    db.commit()
    db.refresh(db_user)
    return db_user


# ------------------------------------------------------------
# Delete user
# ------------------------------------------------------------

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"detail": "User deleted"}
