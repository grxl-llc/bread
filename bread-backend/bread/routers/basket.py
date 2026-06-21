from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.basket_fetcher import fetch_basket_prices

router = APIRouter(prefix="/basket", tags=["Basket"])


@router.get("/search")
async def basket_search(q: str, db: Session = Depends(get_db)):
    print("BASKET ROUTER: received query:", q)
    return await fetch_basket_prices(q, db)
