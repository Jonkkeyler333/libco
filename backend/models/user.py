from __future__ import annotations
from datetime import datetime , timezone
from typing import List , TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship
from enum import Enum

if TYPE_CHECKING:
    from .order import Order
    from .audit_log import AuditLog

class UserRole(str, Enum):
    ADMIN="admin"
    USER="user"

class User(SQLModel, table=True):
    __tablename__ = "user"
    user_id: int|None = Field(primary_key=True, default=None)
    username: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    ID: int = Field(unique=True)
    name: str = Field(unique=True)
    last_name: str = Field(unique=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    password_hash: str = Field(nullable=False)
    role: UserRole = Field(default=UserRole.USER)
    is_active: bool = Field(default=True)
    profile_picture_url: str | None = Field(default=None, nullable=True)
    birthdate: datetime | None = Field(default=None, nullable=True)
    bio: str | None = Field(default=None, nullable=True)
    orders: List["Order"] = Relationship(back_populates="user")
    audit_logs: List["AuditLog"] = Relationship(back_populates="actor")
