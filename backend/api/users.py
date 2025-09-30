from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session
from typing import Annotated

from db.database import get_session
from schemas.create_order import OrderListResponse
from services.orders_service import get_user_orders, BusinessError
from services.auth_service import verify_token as verify_token_service
from fastapi.security import OAuth2PasswordBearer

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

router = APIRouter(prefix="/users", tags=["Users (Historial de Pedidos)"])

# US-06: Endpoint para listar pedidos del usuario
@router.get("/{user_id}/orders", response_model=OrderListResponse)
def get_user_orders_endpoint(
    user_id: int,
    page: Annotated[int, Query(ge=1, description="Número de página")] = 1,
    page_size: Annotated[int, Query(ge=1, le=50, description="Pedidos por página")] = 10,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(verify_token)
):
    # Validar que el usuario solo pueda ver sus propios pedidos
    if current_user_id != user_id:
        # TODO: En el futuro, permitir a admins ver pedidos de cualquier usuario
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver los pedidos de otro usuario"
        )
    
    try:
        result = get_user_orders(session, user_id, page, page_size)
        return OrderListResponse(**result)
    except BusinessError as be:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(be)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener los pedidos: {str(e)}"
        )