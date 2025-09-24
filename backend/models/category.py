from __future__ import annotations
from typing import List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .product import Product

class CategoryProductLink(SQLModel, table=True):
    __tablename__ = "category_product_link"
    category_id: int = Field(foreign_key="category.category_id", primary_key=True, nullable=False)
    product_id: int = Field(foreign_key="product.product_id", primary_key=True, nullable=False)

class Category(SQLModel, table=True):
    __tablename__ = "category"
    category_id: int = Field(nullable=False, primary_key=True, unique=True)
    name: str = Field(index=True, nullable=False, unique=True)
    description: str = Field(index=True, nullable=False)
    products: List["Product"] = Relationship(back_populates="categories", link_model=CategoryProductLink)
