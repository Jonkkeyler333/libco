import os
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent))

from logging.config import fileConfig

from alembic import context
from sqlalchemy import create_engine
from sqlmodel import SQLModel
from models import (
    User, UserRole, Order, Product, OrderItem, Inventory,
    Category, CategoryProductLink, AuditLog
)

from core.config import settings
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = SQLModel.metadata

DATABASE_URL = settings.database_url_sqlalchemy
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable is not set.")

config.set_main_option('sqlalchemy.url', DATABASE_URL)

def run_migrations_offline():
    """Run migrations in 'offline' mode."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    """Run migrations in 'online' mode."""
    from db.database import engine
    connectable = engine

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()