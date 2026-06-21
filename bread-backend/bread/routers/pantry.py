from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Add pantry item
# ------------------------------------------------------------

@router.post("/", response_model=schemas.PantryItemRead)
def add_pantry_item(
    item: schemas.PantryItemCreate,
    db: Session = Depends(get_db)
):
    # Ensure household exists
    household = db.query(models.Household).filter(models.Household.id == item.household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Ensure ingredient exists
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == item.ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    new_item = models.PantryItem(
        household_id=item.household_id,
        ingredient_id=item.ingredient_id,
        quantity=item.quantity,
        unit=item.unit
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ------------------------------------------------------------
# List pantry items for a household
# ------------------------------------------------------------

@router.get("/household/{household_id}", response_model=List[schemas.PantryItemRead])
def list_pantry_items(
    household_id: int,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return db.query(models.PantryItem).filter(models.PantryItem.household_id == household_id).all()


# ------------------------------------------------------------
# Update pantry item
# ------------------------------------------------------------

@router.put("/{item_id}", response_model=schemas.PantryItemRead)
def update_pantry_item(
    item_id: int,
    item: schemas.PantryItemCreate,
    db: Session = Depends(get_db)
):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    db_item.household_id = item.household_id
    db_item.ingredient_id = item.ingredient_id
    db_item.quantity = item.quantity
    db_item.unit = item.unit

    db.commit()
    db.refresh(db_item)
    return db_item


# ------------------------------------------------------------
# Delete pantry item
# ------------------------------------------------------------

@router.delete("/{item_id}")
def delete_pantry_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    db.delete(item)
    db.commit()
    return {"detail": "Pantry item deleted"}
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Add pantry item
# ------------------------------------------------------------

@router.post("/", response_model=schemas.PantryItemRead)
def add_pantry_item(
    item: schemas.PantryItemCreate,
    db: Session = Depends(get_db)
):
    # Ensure household exists
    household = db.query(models.Household).filter(models.Household.id == item.household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    # Ensure ingredient exists
    ingredient = db.query(models.Ingredient).filter(models.Ingredient.id == item.ingredient_id).first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")

    new_item = models.PantryItem(
        household_id=item.household_id,
        ingredient_id=item.ingredient_id,
        quantity=item.quantity,
        unit=item.unit
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item


# ------------------------------------------------------------
# List pantry items for a household
# ------------------------------------------------------------

@router.get("/household/{household_id}", response_model=List[schemas.PantryItemRead])
def list_pantry_items(
    household_id: int,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return db.query(models.PantryItem).filter(models.PantryItem.household_id == household_id).all()


# ------------------------------------------------------------
# Update pantry item
# ------------------------------------------------------------

@router.put("/{item_id}", response_model=schemas.PantryItemRead)
def update_pantry_item(
    item_id: int,
    item: schemas.PantryItemCreate,
    db: Session = Depends(get_db)
):
    db_item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    db_item.household_id = item.household_id
    db_item.ingredient_id = item.ingredient_id
    db_item.quantity = item.quantity
    db_item.unit = item.unit

    db.commit()
    db.refresh(db_item)
    return db_item


# ------------------------------------------------------------
# Delete pantry item
# ------------------------------------------------------------

@router.delete("/{item_id}")
def delete_pantry_item(
    item_id: int,
    db: Session = Depends(get_db)
):
    item = db.query(models.PantryItem).filter(models.PantryItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Pantry item not found")

    db.delete(item)
    db.commit()
    return {"detail": "Pantry item deleted"}
