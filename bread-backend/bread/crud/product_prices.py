from sqlalchemy.orm import Session
from datetime import datetime
from bread.models import ProductPrice


def create_or_update_price(
    db: Session,
    product_id: int,
    store_id: int,
    ingredient_id: int,
    zip_code: str,
    price: float,
    source: str,
    confidence: float = 0.5,
    is_true_price: bool = True,
    raw_payload=None,
):
    existing = (
        db.query(ProductPrice)
        .filter(
            ProductPrice.product_id == product_id,
            ProductPrice.store_id == store_id,
            ProductPrice.ingredient_id == ingredient_id,
            ProductPrice.zip_code == zip_code,
        )
        .first()
    )

    if existing:
        existing.price = price
        existing.source = source
        existing.confidence = confidence
        existing.is_true_price = 1 if is_true_price else 0
        existing.raw_payload = raw_payload
        existing.last_updated = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    new_price = ProductPrice(
        product_id=product_id,
        store_id=store_id,
        ingredient_id=ingredient_id,
        zip_code=zip_code,
        price=price,
        source=source,
        confidence=confidence,
        is_true_price=1 if is_true_price else 0,
        raw_payload=raw_payload,
        last_updated=datetime.utcnow(),
    )

    db.add(new_price)
    db.commit()
    db.refresh(new_price)
    return new_price
