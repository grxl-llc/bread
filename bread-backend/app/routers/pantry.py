from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.pantry import PantryItem, PantryItemCreate
from app.schemas.ingredient import Ingredient

router = APIRouter(
    prefix="/pantry",
    tags=["Pantry"]
)

@router.get("/", response_model=list[PantryItem])
def list_pantry_items(db: Session = Depends(get_db)):
    items = db.query(models.PantryItem).all()
    return items

@router.get("/{item_id}", response_model=PantryItem)
def get_pantry_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")
    return item

@router.post("/", response_model=PantryItem)
def create_pantry_item(item: PantryItemCreate, db: Session = Depends(get_db)):
    new_item = models.PantryItem(
        ingredient_id=item.ingredient_id,
        quantity=item.quantity,
        unit=item.unit
    )
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item
