from sqlmodel import Session
from repositories.product_repository import ProductRepository
from models.product import Product
from datetime import datetime, timezone


def get_products(session:Session, limit:int=10, offset:int=0) -> list[Product]:
    product_repo = ProductRepository(session)
    return product_repo.get_products(limit=limit, offset=offset)