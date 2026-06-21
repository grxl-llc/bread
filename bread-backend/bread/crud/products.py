from typing import Optional
from sqlalchemy.orm import Session
from bread import models

def get_or_create_product(db: Session, name: str, external_id: Optional[str]):
    product = (
        db.query(models.Product)
        .filter(models.Product.external_id == external_id)
        .first()
    )

    if product:
        return product

    product = models.Product(
        name=name,
        external_id=external_id,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product
