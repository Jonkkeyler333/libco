from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any , Annotated

from db.database import get_session
from schemas.create_order import (
    CreateOrderRequest , 
    CreateOrderResponse ,
    EditOrderItemRequest, 
    OrderItemResponse,
    OrdenStatus,
    CreateOrderResponse , 
    InsufficientStockError as InsufficientStockErrorSchema,
    ProductNotFoundError as ProductNotFoundErrorSchema)

from services.auth_service import verify_token as verify_token_service
from services.orders_service import (
    create_order,
    delete_order_item, 
    validate_order, 
    confirm_order, 
    BusinessError,
    edit_order_item,
    get_order_details,
    InsufficientStockError,
    ProductNotFoundError
)
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from core.config import settings
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

router = APIRouter(prefix="/orders", tags=["Orders (Crear Pedido)"])

@router.post("/", response_model=CreateOrderResponse, status_code=status.HTTP_201_CREATED,responses={404: {"model": ProductNotFoundErrorSchema}})
def create_order_endpoint(
    request: CreateOrderRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        items_data = [item.model_dump() for item in request.items]
        order, items_details = create_order(session, user_id, items_data)
        if order.order_id is None:
            raise BusinessError("No se pudo obtener el ID de la orden")
        items_response = [
            OrderItemResponse(
                order_item_id=item["order_item_id"],
                product_id=item["product_id"],
                product_title=item["product_title"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                sub_total=item["sub_total"]
            ) for item in items_details
        ]
        return CreateOrderResponse(
            order_id=order.order_id,
            status=OrdenStatus(order.status),
            total=order.total,
            created_at=order.created_at,
            items=items_response,
            items_count=len(items_response),
            message="Orden creada exitosamente",
            next_step="Validar orden"
        )
    except ProductNotFoundError as pnf:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail=ProductNotFoundErrorSchema(
                detail=pnf.message,
                error_code="PRODUCT_NOT_FOUND",
                product_id=pnf.product_id
            ).model_dump()
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.post("/{order_id}/validate", response_model=CreateOrderResponse, 
             responses={409: {"model": InsufficientStockErrorSchema}})
def validate_order_endpoint(
    order_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        order, items_details = validate_order(session, order_id)
        items_response = [
            OrderItemResponse(
                order_item_id=item["order_item_id"],
                product_id=item["product_id"],
                product_title=item["product_title"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                sub_total=item["sub_total"]
            ) for item in items_details
        ]
        
        return CreateOrderResponse(
            order_id=order.order_id, # type: ignore
            status=OrdenStatus(order.status),
            total=order.total,
            created_at=order.created_at,
            items=items_response,
            items_count=len(items_response),
            message="Orden validada exitosamente",
            next_step="Confirmar orden"
        )
    except InsufficientStockError as ise:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=InsufficientStockErrorSchema(
                detail=ise.message,
                error_code="INSUFFICIENT_STOCK",
                available_stock=ise.available_stock
            ).model_dump()
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.post("/{order_id}/confirm", response_model=CreateOrderResponse)
def confirm_order_endpoint(
    order_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        order, items_details = confirm_order(session, order_id)
        items_response = [
            OrderItemResponse(
                order_item_id=item["order_item_id"],
                product_id=item["product_id"],
                product_title=item["product_title"],
                quantity=item["quantity"],
                unit_price=item["unit_price"],
                sub_total=item["sub_total"]
            ) for item in items_details
        ]
        return CreateOrderResponse(
            order_id=order.order_id, # type: ignore
            status=OrdenStatus(order.status),
            total=order.total,
            created_at=order.created_at,
            items=items_response,
            items_count=len(items_response),
            message="Orden confirmada exitosamente",
            next_step="Pedido completado"
        )
    except InsufficientStockError as ise:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=InsufficientStockErrorSchema(
                detail=ise.message,
                error_code="INSUFFICIENT_STOCK",
                available_stock=ise.available_stock
            ).model_dump()
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.put("/{order_id}/items/{item_id}", response_model=OrderItemResponse)
def edit_order_item_endpoint(
    order_id: int,
    item_id: int,
    quantity: EditOrderItemRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        data=quantity.model_dump()
        order_item_updated = edit_order_item(session, order_id, item_id, data['quantity'])
        order,items=get_order_details(session, order_id)
        item = [it for it in items if it['order_item_id'] == order_item_updated.order_item_id]
        return item[0]
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))

@router.delete("/{order_id}/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_order_item_endpoint(
    order_id: int,
    item_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        delete_order_item(session, order_id, item_id)
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))