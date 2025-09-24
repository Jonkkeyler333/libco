from __future__ import annotations
from datetime import datetime , timezone
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .product import Product

class Inventory(SQLModel, table=True):
    __tablename__ = "inventory"
    inventory_id: int = Field(primary_key=True)
    product_id: int = Field(foreign_key="product.product_id", index=True)
    quantity: int = Field(default=0, ge=0)
    reserved: int = Field(default=0, ge=0)
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    product: "Product" = Relationship(back_populates="inventory_product")
