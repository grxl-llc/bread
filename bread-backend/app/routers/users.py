from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.user import User, UserCreate

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)

@router.post("/", response_model=User)
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    # Check if username already exists
    existing_user = db.query(models.User).filter(models.User.username == user.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Create user
    new_user = models.User(
        username=user.username,
        email=user.email,
        zipcode=user.zipcode,
        preferred_stores=",".join(user.preferred_stores) if user.preferred_stores else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.get("/{user_id}", response_model=User)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Convert preferred_stores back to list
    if user.preferred_stores:
        user.preferred_stores = user.preferred_stores.split(",")

    return user
