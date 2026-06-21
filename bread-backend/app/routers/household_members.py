from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.household_member import HouseholdMember, HouseholdMemberCreate

router = APIRouter(
    prefix="/household-members",
    tags=["Household Members"]
)

@router.get("/", response_model=list[HouseholdMember])
def list_household_members(db: Session = Depends(get_db)):
    members = db.query(models.HouseholdMember).all()
    return members

@router.get("/{member_id}", response_model=HouseholdMember)
def get_household_member(member_id: int, db: Session = Depends(get_db)):
    member = db.query(models.HouseholdMember).filter(models.HouseholdMember.id == member_id).first()
    if not member:
        raise HTTPException(status_code=404, detail="Household member not found")
    return member

@router.post("/", response_model=HouseholdMember)
def create_household_member(member: HouseholdMemberCreate, db: Session = Depends(get_db)):
    new_member = models.HouseholdMember(
        name=member.name,
        age=member.age,
        relationship=member.relationship
    )
    db.add(new_member)
    db.commit()
    db.refresh(new_member)
    return new_member
