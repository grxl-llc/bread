from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from bread.database import get_db
from bread import models, schemas

router = APIRouter()


# ------------------------------------------------------------
# Create household
# ------------------------------------------------------------

@router.post("/", response_model=schemas.HouseholdRead)
def create_household(
    household: schemas.HouseholdCreate,
    db: Session = Depends(get_db)
):
    new_household = models.Household(
        name=household.name,
        owner_id=household.owner_id
    )
    db.add(new_household)
    db.commit()
    db.refresh(new_household)
    return new_household


# ------------------------------------------------------------
# List all households
# ------------------------------------------------------------

@router.get("/", response_model=List[schemas.HouseholdRead])
def list_households(db: Session = Depends(get_db)):
    return db.query(models.Household).all()


# ------------------------------------------------------------
# Get household by ID
# ------------------------------------------------------------

@router.get("/{household_id}", response_model=schemas.HouseholdRead)
def get_household(
    household_id: int,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")
    return household


# ------------------------------------------------------------
# Update household
# ------------------------------------------------------------

@router.put("/{household_id}", response_model=schemas.HouseholdRead)
def update_household(
    household_id: int,
    household: schemas.HouseholdCreate,
    db: Session = Depends(get_db)
):
    db_household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not db_household:
        raise HTTPException(status_code=404, detail="Household not found")

    db_household.name = household.name
    db_household.owner_id = household.owner_id

    db.commit()
    db.refresh(db_household)
    return db_household


# ------------------------------------------------------------
# Delete household
# ------------------------------------------------------------

@router.delete("/{household_id}")
def delete_household(
    household_id: int,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    db.delete(household)
    db.commit()
    return {"detail": "Household deleted"}


# ------------------------------------------------------------
# Add household member
# ------------------------------------------------------------

@router.post("/{household_id}/members", response_model=schemas.HouseholdMemberRead)
def add_household_member(
    household_id: int,
    member: schemas.HouseholdMemberCreate,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    new_member = models.HouseholdMember(
        household_id=household_id,
        name=member.name,
        age_group=member.age_group,
        dietary_notes=member.dietary_notes
    )

    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member


# ------------------------------------------------------------
# List household members
# ------------------------------------------------------------

@router.get("/{household_id}/members", response_model=List[schemas.HouseholdMemberRead])
def list_household_members(
    household_id: int,
    db: Session = Depends(get_db)
):
    household = db.query(models.Household).filter(models.Household.id == household_id).first()
    if not household:
        raise HTTPException(status_code=404, detail="Household not found")

    return db.query(models.HouseholdMember).filter(
        models.HouseholdMember.household_id == household_id
    ).all()
