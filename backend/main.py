from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, text
import logging
from core.config import settings
from api.auth import router as auth_router
from api.orders import router as orders_router
from api.order_item import router as order_item_router
from api.products import router as products_router
from api.inventory import router as inventory_router
from api.users import router as users_router
from api.reports import router as reports_router
from db.database import create_db_and_tables, get_session
from db.seed import seed_database

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("LibCo Backend Starting")
    logger.info(f"Environment: {settings.ENV}")
    logger.info(f"Is Production: {settings.is_production}")
    logger.info(f"Cloud SQL: {settings.CLOUD_SQL_CONNECTION_NAME or 'Not configured'}")
    logger.info(f"DB User: {settings.DB_USER}")
    logger.info(f"DB Password Set: {'Yes' if settings.DB_PASSWORD else 'NO'}")
    logger.info(f"Frontend URL: {settings.FRONTEND_URL}")
    if not settings.is_production:
        logger.info("Development mode: Creating tables and seeding database...")
        create_db_and_tables()
        seed_database()
    else:
        logger.info("production mode: Tables managed by Alembic migrations")
    
    yield
    logger.info("Shutting down LibCo Backend")

app = FastAPI(
    title='LibCo',
    description="API para la gestión de libros - LIBCO",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - configuración explícita para deploy
allowed_origins = list(set(settings.CORS_ORIGINS + [settings.FRONTEND_URL]))
logger.info(fCORS Allowed Origins: {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Routers
app.include_router(auth_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(order_item_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

# Root endpoints
@app.get("/", response_class=HTMLResponse, tags=["Bienvenida"])
async def read_root():
    return f"""
    <html>
        <head>
            <title>LibCo - Sistema de gestión de libros</title>
        </head>
        <body>
            <h1>Bienvenido a LibCo</h1>
            <p>API para la gestión de libros</p>
            <p>Environment: <strong>{settings.ENV}</strong></p>
            <p><a href="/docs">Documentación API</a></p>
        </body>
    </html>
    """

@app.get("/health", tags=["Health"])
async def health_check():
    """Health check básico para Cloud Run"""
    logger.info("Health check called")
    return {
        "status": "healthy",
        "service": "libco-backend",
        "environment": settings.ENV,
        "version": "1.0.0"
    }