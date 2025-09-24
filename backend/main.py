from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

app = FastAPI(
    title=settings.app_name,
    description="API para la gestion de libros - LIBCO",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

@app.get("/", response_class=HTMLResponse)
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