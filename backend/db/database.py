from sqlmodel import SQLModel, create_engine, Session
from core.config import settings
import logging
logger = logging.getLogger(__name__)
from models.user import User
from models.order import Order
from models.audit_log import AuditLog
from models.product import Product
from models.order_item import OrderItem
from models.inventory import Inventory
from models.category import Category, CategoryProductLink

database_url = settings.database_url_sqlalchemy
logger.info(f"Initializing database engine...")
logger.info(f"Environment: {settings.ENV}")
logger.info(f"Is Production: {settings.is_production}")
engine = create_engine(
    database_url,
    echo=settings.ENV == "development",  # SQL logging solo en dev
    pool_pre_ping=True,  # Verifica conexiones antes de usarlas
    pool_recycle=3600,   # Recicla conexiones cada hora
    connect_args={
        "connect_timeout": 10,
    } if settings.is_production else {}
)

logger.info("✅ Database engine initialized")

def create_db_and_tables():
    if settings.is_production:
        logger.warning("create_db_and_tables() called in production - SKIPPING")
        logger.warning("Use Alembic migrations for production schema changes")
        return
    
    logger.info("Creating database tables (development only)...")
    
    # Rebuild models para resolver referencias circulares
    User.model_rebuild()
    Order.model_rebuild()
    AuditLog.model_rebuild()
    Product.model_rebuild()
    OrderItem.model_rebuild()
    Inventory.model_rebuild()
    Category.model_rebuild()
    CategoryProductLink.model_rebuild()
    
    SQLModel.metadata.create_all(engine)
    logger.info("✅ Database tables created")

def get_session():
    """Get database session dependency for FastAPI"""
    with Session(engine) as session:
        yield session