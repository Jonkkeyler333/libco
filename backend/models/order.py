from datetime import datetime , timezone
from typing import List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

from .order_item import OrderItem

if TYPE_CHECKING:
    from .user import User
    from .product import Product


class Order(SQLModel, table=True):
    __tablename__ = "order"  # type: ignore[assignment]
    order_id: int = Field(primary_key=True)
    status: str = Field(default='draft')
    total: float = Field(default=0)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    user_created: int = Field(foreign_key="user.user_id")
    user: "User"= Relationship(back_populates="orders")
    products: List["Product"] = Relationship(back_populates="orders", link_model=OrderItem)