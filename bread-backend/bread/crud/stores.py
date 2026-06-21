from sqlalchemy.orm import Session
from bread.models import Store


def get_or_create_store(
    db: Session,
    name: str,
    chain: str,
    zip_code: str
):
    """
    Ensures a store exists exactly once.
    Uniqueness is based on (name, chain, zip_code).
    """

    existing = (
        db.query(Store)
        .filter(
            Store.name == name,
            Store.chain == chain,
            Store.zip_code == zip_code,
        )
        .first()
    )

    if existing:
        return existing

    new_store = Store(
        name=name,
        chain=chain,
        zip_code=zip_code,
    )

    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store
