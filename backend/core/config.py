from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from typing import Optional
import logging
import os
from pathlib import Path

logger = logging.getLogger(__name__)

def read_secret_file(secret_name: str) -> Optional[str]:
    """Lee un archivo de secreto desde /secrets/ si existe"""
    secret_path = Path(f"/secrets/{secret_name}")
    logger.info(f"Checking for secret file at: {secret_path}")
    secrets_dir = Path("/secrets")
    if secrets_dir.exists():
        logger.info(f"/secrets directory exists")
        try:
            files = list(secrets_dir.iterdir())
            logger.info(f"Files in /secrets: {[f.name for f in files]}")
        except Exception as e:
            logger.warning(f"Could not list /secrets directory: {e}")
    else:
        logger.warning(f"/secrets directory does not exist")
    
    if secret_path.exists():
        try:
            content = secret_path.read_text().strip()
            logger.info(f"Secret file found and read successfully (length: {len(content)})")
            return content
        except Exception as e:
            logger.error(f"Could not read secret from {secret_path}: {e}")
    else:
        logger.warning(f"Secret file does not exist: {secret_path}")
    
    return None

class Settings(BaseSettings):
    ENV: str = "development"
    CLOUD_SQL_CONNECTION_NAME: Optional[str] = None
    DB_USER: str = "postgres"
    DB_PASSWORD: str = ""
    DB_NAME: str = "appdb"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/appdb"
    JWT_SECRET: str = "change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 30
    FRONTEND_URL: str = "https://libco-aa776.web.app"
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8000",
        "https://libco-aa776.web.app",
        "https://libco-aa776.firebaseapp.com"
    ]
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True
    )
    
    def __init__(self, **data):
        super().__init__(**data)
        logger.info(f"🔧 Initializing Settings - DB_PASSWORD from env: {'Yes' if self.DB_PASSWORD else 'No'}")
        
        if not self.DB_PASSWORD:
            logger.info("🔍 DB_PASSWORD is empty, attempting to read from secret file...")
            secret_password = read_secret_file("db-password")
            if secret_password:
                self.DB_PASSWORD = secret_password
                logger.info("✅ DB_PASSWORD successfully loaded from secret file")
            else:
                logger.error("❌ Failed to load DB_PASSWORD from secret file")
        else:
            logger.info("✅ DB_PASSWORD already set from environment variable")
    
    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"
    
    @property
    def database_url_sqlalchemy(self) -> str:
        """
        Construye la DATABASE_URL correcta según el entorno.
        
        Producción (Cloud SQL):
          postgresql://USER:PASSWORD@/DATABASE?host=/cloudsql/CONNECTION_NAME
        
        Desarrollo:
          postgresql://postgres:postgres@db:5432/appdb
        """
        if self.is_production and self.CLOUD_SQL_CONNECTION_NAME:
            if not self.DB_PASSWORD:
                logger.error("DB_PASSWORD not set in production!")
                raise ValueError("DB_PASSWORD is required in production")
            db_url = (
                f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}"
                f"@/{self.DB_NAME}"
                f"?host=/cloudsql/{self.CLOUD_SQL_CONNECTION_NAME}"
            )
            safe_url = db_url.replace(self.DB_PASSWORD, "***")
            logger.info(f"Using Cloud SQL: {safe_url}")
            return db_url
        logger.info(f"Using local database: {self.DATABASE_URL}")
        return self.DATABASE_URL
    
settings = Settings()

logger.info(f"=== LibCo Backend Configuration ===")
logger.info(f"Environment: {settings.ENV}")
logger.info(f"Is Production: {settings.is_production}")
logger.info(f"Cloud SQL Connection: {settings.CLOUD_SQL_CONNECTION_NAME or 'Not configured'}")
logger.info(f"DB User: {settings.DB_USER}")
logger.info(f"DB Password Set: {'Yes' if settings.DB_PASSWORD else ' NO'}")