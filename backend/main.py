from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware

from core.config import settings
from api.auth import router as auth_router
from api.orders import router as orders_router
from api.products import router as products_router
from api.inventory import router as inventory_router
from db.database import create_db_and_tables
from db.seed import seed_database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    create_db_and_tables()
    seed_database()  # Sembrar la base de datos
    yield
    # Shutdown (si necesitas hacer algo al cerrar)

app = FastAPI(
    title=settings.app_name,
    description="API para la gestion de libros - LIBCO",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Rutas
app.include_router(auth_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(products_router, prefix="/api")
app.include_router(inventory_router, prefix="/api")

@app.get("/", response_class=HTMLResponse,tags=["Bienvenida"])
async def read_root():
    return """
    <html>
        <head>
            <title>LibCo - Sistema de gestion de libros</title>
        </head>
        <body>
            <h1>Bienvenido a LibCo</h1>
            <p>API para la gestion de libros</p>
        </body>
    </html>
    """

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}