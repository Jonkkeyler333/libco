from datetime import datetime , timezone
from typing import List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from .order_item import OrderItem
from .category import Category, CategoryProductLink

if TYPE_CHECKING:
    from .inventory import Inventory
    from .order import Order


class Product(SQLModel, table=True):
    __tablename__ = "product"  # type: ignore[assignment]
    product_id: int | None = Field(default=None, primary_key=True)
    sku: str = Field(index=True, unique=True)
    title: str = Field(unique=True)
    author: str = Field(index=True)
    isbn: str = Field(index=True)
    format: str = Field(default="paperback")
    edition: str = Field(default="1st")
    description: str | None = None
    language: str = Field(default="en")
    publisher: str = Field(index=True)
    publication_year: int = Field(index=True)
    price: float = Field(index=True, ge=0.0, default=0.0)
    pages: int = Field(ge=1, default=1)
    currency: str = Field(default="COP")
    weight: float = Field(ge=0.0, default=0.0)
    dimensions: str = Field(default="0x0x0")
    front_page_url: str | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    inventory_product: "Inventory" = Relationship(back_populates="product")
    categories: List["Category"] = Relationship(back_populates="products", link_model=CategoryProductLink)
    orders: List["Order"] = Relationship(back_populates="products", link_model=OrderItem)
