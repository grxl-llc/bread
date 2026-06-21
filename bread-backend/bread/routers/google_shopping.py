from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.google_shopping_fetcher import fetch_google_prices

router = APIRouter(prefix="/google", tags=["Google Shopping"])


@router.get("/search")
async def google_search(q: str, db: Session = Depends(get_db)):
    print("GOOGLE ROUTER: received query:", q)
    return await fetch_google_prices(q, db)
