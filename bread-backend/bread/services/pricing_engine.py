from sqlalchemy.orm import Session
from bread.models import ProductPrice


def resolve_best_price(db: Session, ingredient_id: int, zip_code: str):
    prices = (
        db.query(ProductPrice)
        .filter(
            ProductPrice.ingredient_id == ingredient_id,
            ProductPrice.zip_code == zip_code,
        )
        .order_by(
            ProductPrice.confidence.desc(),
            ProductPrice.last_updated.desc()
        )
        .all()
    )

    if not prices:
        return None

    return prices[0]  # highest confidence + freshest
