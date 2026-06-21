from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.target_fetcher import fetch_target_prices

router = APIRouter(prefix="/target", tags=["Target"])

@router.get("/search")
async def target_search(q: str, zip_code: str, db: Session = Depends(get_db)):
    print("TARGET ROUTER: received query:", q, "zip:", zip_code)
    return await fetch_target_prices(q, db, zip_code)
