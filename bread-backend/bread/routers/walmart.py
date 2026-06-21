from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from bread.database import get_db
from bread.tasks.walmart_fetcher import fetch_walmart_prices

router = APIRouter(
    prefix="/walmart",
    tags=["Walmart"],
)

@router.get("/search")
async def walmart_search(q: str, db: Session = Depends(get_db)):
    print("ROUTER: received query:", q)
    try:
        result = await fetch_walmart_prices(q, db)
        print("ROUTER: fetcher returned:", result)
        return result
    except Exception as e:
        print("ROUTER ERROR:", type(e), e)
        raise
