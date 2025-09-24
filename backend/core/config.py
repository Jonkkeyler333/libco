from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "LibCo - Sistema de gestion de libros"
    ENV: str = "development"
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/appdb"
    JWT_SECRET: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    CORS_ORIGINS:list[str]=[
        "http://localhost",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://localhost:5173"
    ]
    CORS_ALLOW_CREDENTIALS:bool=True
    CORS_ALLOW_METHODS:list[str]=["*"]
    CORS_ALLOW_HEADERS:list[str]=["*"]

    class Config:
        env_file = ".env"

settings = Settings()
