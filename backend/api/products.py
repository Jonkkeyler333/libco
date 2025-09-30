from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any , Annotated
from schemas.products import ProductsResponse
from db.database import get_session

from services.products_service import get_products


from core.config import settings
from fastapi.security import OAuth2PasswordBearer
from services.auth_service import verify_token as verify_token_service
from schemas.products import ProductBase

# Configure OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Dependencia para verificar token y obtener user_id
def verify_token(token: str = Depends(oauth2_scheme)) -> int:
    """Verificar token JWT y devolver el user_id"""
    payload = verify_token_service(token)
    user_id = payload.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token no contiene user_id",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user_id

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=ProductsResponse)
def get_products_endpoint(
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    products = get_products(session)
    compatible_products = [ProductBase.model_validate(p.model_dump()) for p in products]
    return ProductsResponse(products=compatible_products)