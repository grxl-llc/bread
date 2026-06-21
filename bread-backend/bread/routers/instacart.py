from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.instacart_fetcher import fetch_instacart_prices

router = APIRouter(prefix="/instacart", tags=["Instacart"])


@router.get("/search")
async def instacart_search(q: str, zip_code: str | None = None, db: Session = Depends(get_db)):
    print("INSTACART ROUTER: received query:", q, "zip:", zip_code)
    return await fetch_instacart_prices(q, db, zip_code=zip_code)
