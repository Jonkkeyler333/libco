# Database connection and session management
from sqlmodel import SQLModel, create_engine, Session
from core.config import settings

# Create engine
engine = create_engine(settings.DATABASE_URL, echo=True)

def create_db_and_tables():
    """Create database tables"""
    SQLModel.metadata.create_all(engine)

def get_session():
    """Get database session dependency for FastAPI"""
    with Session(engine) as session:
        yield session