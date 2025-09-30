from datetime import datetime , timezone
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field

if TYPE_CHECKING:
    from .order import Order
    from .product import Product

class OrderItem(SQLModel, table=True):
    __tablename__ = "order_item" # type: ignore[assignment]
    order_item_id: int|None = Field(default=None, primary_key=True)
    order_id: int = Field(foreign_key="order.order_id", index=True)
    product_id: int = Field(foreign_key="product.product_id", index=True)
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(default=0, ge=0)
    sub_total: float = Field(default=0, ge=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))