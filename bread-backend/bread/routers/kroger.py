from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.kroger_fetcher import fetch_kroger_prices

router = APIRouter(prefix="/kroger", tags=["Kroger"])

@router.get("/search")
async def kroger_search(q: str, zip_code: str, db: Session = Depends(get_db)):
    print("KROGER ROUTER: received query:", q, "zip:", zip_code)
    return await fetch_kroger_prices(q, db, zip_code)
