from typing import Optional
from sqlmodel import Session, select
from models.product import Product

class ProductRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_product_by_id(self, product_id: int) -> Optional[Product]:
        statement = select(Product).where(Product.product_id == product_id)
        return self.session.exec(statement).first()

    def get_products(self, limit: int = 10, offset: int = 0) -> list[Product]:
        statement = select(Product).offset(offset).limit(limit)
        return list(self.session.exec(statement).all())