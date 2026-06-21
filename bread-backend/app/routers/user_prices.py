from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.schemas.user_price import UserPrice, UserPriceCreate

router = APIRouter(
    prefix="/user-prices",
    tags=["User Prices"]
)

@router.get("/", response_model=list[UserPrice])
def list_user_prices(db: Session = Depends(get_db)):
    prices = db.query(models.UserPrice).all()
    return prices

@router.get("/{price_id}", response_model=UserPrice)
def get_user_price(price_id: int, db: Session = Depends(get_db)):
    price = db.query(models.UserPrice).filter(models.UserPrice.id == price_id).first()
    if not price:
        raise HTTPException(status_code=404, detail="User price not found")
    return price

@router.post("/", response_model=UserPrice)
def create_user_price(price: UserPriceCreate, db: Session = Depends(get_db)):
    new_price = models.UserPrice(
        user_id=price.user_id,
        product_id=price.product_id,
        price=price.price
    )
    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    return new_price
