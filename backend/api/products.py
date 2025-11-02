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

@router.post("/create", response_model=ProductBase)
def create_product_endpoint(
    product: dict,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    from models.product import Product
    
    try:
        new_product = Product(
            sku=product["sku"],
            title=product["title"],
            author=product["author"],
            isbn=product["isbn"],
            format=product.get("format", "paperback"),
            edition=product.get("edition", "1st"),
            description=product.get("description"),
            language=product.get("language", "es"),
            publisher=product["publisher"],
            publication_year=product["publication_year"],
            price=product["price"],
            pages=product["pages"],
            currency=product.get("currency", "COP"),
            weight=product["weight"],
            dimensions=product.get("dimensions", "0x0x0"),
            front_page_url=product.get("front_page_url"),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        session.add(new_product)
        session.commit()
        session.refresh(new_product)
        
        return ProductBase(
            product_id=new_product.product_id,
            title=new_product.title,
            author=new_product.author,
            isbn=new_product.isbn,
            format=new_product.format,
            edition=new_product.edition,
            description=new_product.description,
            language=new_product.language,
            publisher=new_product.publisher,
            publication_year=new_product.publication_year,
            price=new_product.price,
            pages=new_product.pages,
            currency=new_product.currency,
            weight=new_product.weight,
            dimensions=new_product.dimensions,
            front_page_url=new_product.front_page_url
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Error al crear el producto: {str(e)}"
        )    