from sqlmodel import SQLModel, create_engine, Session
from core.config import settings

from models.user import User
from models.order import Order
from models.audit_log import AuditLog
from models.product import Product
from models.order_item import OrderItem

# Create engine
engine = create_engine(settings.DATABASE_URL, echo=True)

def create_db_and_tables():
    """Create database tables"""
    User.model_rebuild()
    Order.model_rebuild()
    AuditLog.model_rebuild()
    Product.model_rebuild()
    OrderItem.model_rebuild()
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session dependency for FastAPI"""
    with Session(engine) as session:
        yield session