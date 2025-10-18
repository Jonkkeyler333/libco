from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from db.database import get_session
from schemas.create_order import (
    OrderItemResponse,
    OrdenStatus)

from services.auth_service import verify_token as verify_token_service
from services.orders_service import (
    get_order_details,
    BusinessError
)
from core.config import settings
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# dependencia para verificar token y obtener user_id
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

router = APIRouter(prefix="/order/item", tags=["Order_Item (Detalles del pedido)"])

@router.get("/{order_id}", response_model=list[OrderItemResponse])
def get_order_items(
    order_id: int,
    user_id: int = Depends(verify_token),
    session: Session = Depends(get_session)
):
    try :
        _,order_details = get_order_details(session, order_id)
    except BusinessError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    return order_details
