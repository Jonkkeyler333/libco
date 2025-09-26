from __future__ import annotations
from datetime import datetime , timezone
from typing import TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from .user import User

class AuditLog(SQLModel, table=True):
    __tablename__ = "audit_log"
    audit_log_id: int = Field(primary_key=True)
    actor_id: int = Field(foreign_key="user.user_id")
    action: str = Field(default="create")
    object_type: str = Field(default="create")
    object_id: int = Field(default=0)
    before_state: str | None = Field(default=None, nullable=True)
    after_state: str | None = Field(default=None, nullable=True)
    description: str | None = Field(default=None, nullable=True)
    create_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    # actor: "User" = Relationship(back_populates="audit_logs")
