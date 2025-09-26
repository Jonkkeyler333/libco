"""update_user_role_to_user

Revision ID: c8adaa753cd4
Revises: c784ba8829fc
Create Date: 2025-09-26 17:17:16.150605

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c8adaa753cd4'
down_revision: Union[str, None] = 'c784ba8829fc'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add new enum value 'USER' - this needs to be committed before use
    op.execute("ALTER TYPE userrole ADD VALUE IF NOT EXISTS 'USER'")


def downgrade() -> None:
    # Update 'USER' values back to 'CLIENTE' 
    op.execute("UPDATE \"user\" SET role = 'CLIENTE' WHERE role = 'USER'")
    
    # Note: PostgreSQL doesn't support removing enum values directly
    # Would need to recreate the enum type to remove 'USER' value
