from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any , Annotated
from fastapi.responses import StreamingResponse
from io import BytesIO

from db.database import get_session
from schemas.create_order import (
    CreateOrderRequest ,
    CancelOrderResponse,
    CreateOrderResponse ,
    EditOrderItemRequest, 
    OrderItemResponse,
    OrderByIdResponse,
    allOrder,
    OrdenStatus,
    CreateOrderResponse , 
    AddOrderItemRequest,
    InsufficientStockError as InsufficientStockErrorSchema,
    ProductNotFoundError as ProductNotFoundErrorSchema,
    OrderListResponse)

from services.auth_service import verify_token as verify_token_service
from services.orders_service import (
    create_order,
    delete_order_item, 
    validate_order, 
    confirm_order, 
    BusinessError,
    edit_order_item,
    get_order_details,
    get_user_orders,
    get_order_by_id,
    get_all_orders,
    get_order_pdf,
    InsufficientStockError,
    ProductNotFoundError,
    cancel_order,
    add_order_item
)
from services.products_service import get_product_by_id
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
            ).model_dump(mode='json')
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    
@router.delete("/{order_id}/cancel", response_model=CancelOrderResponse)
def cancel_order_endpoint(
    order_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        order= cancel_order(session, order_id)
        return CancelOrderResponse(
            order_id=order.order_id, # type: ignore
            status=OrdenStatus(order.status),
            message="Orden cancelada exitosamente",
            next_step="N/A"
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
        error_response = InsufficientStockErrorSchema(
            detail=ise.message,
            error_code="INSUFFICIENT_STOCK",
            available_stock=ise.available_stock
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error_response.model_dump(mode='json')
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
        error_response = InsufficientStockErrorSchema(
            detail=ise.message,
            error_code="INSUFFICIENT_STOCK",
            available_stock=ise.available_stock
        )
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=error_response.model_dump(mode='json')
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
    
@router.post("/{order_id}/item",response_model=OrderItemResponse,status_code=status.HTTP_201_CREATED)
def add_order_item_endpoint(
    order_id: int,
    item: AddOrderItemRequest,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    try:
        data=item.model_dump()
        order_item_added = add_order_item(session, order_id,data["product_id"],data['quantity'])
        product = get_product_by_id(session, data["product_id"])
        return OrderItemResponse(
            order_item_id=order_item_added[0].order_item_id,  # type: ignore
            product_id=order_item_added[0].product_id,
            product_title=product.title if product else "Unknown",
            quantity=order_item_added[0].quantity,
            unit_price=order_item_added[0].unit_price,
            sub_total=order_item_added[0].sub_total
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))

@router.get("/{order_id}",response_model=OrderByIdResponse,tags=["Orders (Obtener Pedido por ID)"])
def get_order_by_id_endpoint(
    order_id:int,
    session:Session=Depends(get_session),
    user_id:int=Depends(verify_token)
):
    try:
        order=get_order_by_id(session,order_id)
        return order
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))

@router.get("/user/{user_id}", response_model=OrderListResponse, tags=["Orders (Listar Pedidos)"])
def get_user_orders_endpoint(
    user_id: int,
    page: int = 1,
    page_size: int = 10,
    session: Session = Depends(get_session),
    current_user_id: int = Depends(verify_token)
):
    """
    Listar todos los pedidos del usuario con paginación.
    
    - **user_id**: ID del usuario para obtener sus pedidos
    - **page**: Número de página (default: 1)
    - **page_size**: Número de pedidos por página (default: 10, max: 50)
    """
    if current_user_id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para ver los pedidos de otro usuario"
        )
    if page < 1:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de página debe ser mayor a 0"
        )
    
    if page_size < 1 or page_size > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El tamaño de página debe estar entre 1 y 50"
        )
    
    try:
        result = get_user_orders(session, user_id, page, page_size)
        return OrderListResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener los pedidos: {str(e)}"
        )

@router.get("/{order_id}/document")
def get_order_document_endpoint(
    order_id: int,
    session: Session = Depends(get_session),
    user_id: int = Depends(verify_token)
):
    """
    Obtener el documento PDF del pedido.
    
    - **order_id**: ID del pedido
    """
    try:
        pdf_buffer = get_order_pdf(session, order_id)
        if pdf_buffer is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Orden no encontrada o error generando PDF"
            )
        headers = {
            'Content-Disposition': f'attachment; filename="LibCo_Orden_{order_id}.pdf"'
        }
        return StreamingResponse(
            iter([pdf_buffer.getvalue()]), 
            media_type='application/pdf', 
            headers=headers
        )
    except BusinessError as be:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(be))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener el documento del pedido: {str(e)}"
        )
        
@router.get("/orders/external", response_model=list[allOrder],tags=["Orders (Obtener Todos los Pedidos) - External Endpoint"])
def get_all_orders_external(
    page: int = 1,
    page_size: int = 10,
    session: Session = Depends(get_session)
):
    try:
        orders_with_details = get_all_orders(session, limit=page_size, offset=(page-1)*page_size)
        orders_response = []
        for order, items in orders_with_details:
            items_response = [
                OrderItemResponse(
                    order_item_id=item["order_item_id"],
                    product_id=item["product_id"],
                    product_title=item["product_title"],
                    quantity=item["quantity"],
                    unit_price=item["unit_price"],
                    sub_total=item["sub_total"]
                ) for item in items
            ]
            orders_response.append(allOrder(    
                order_id=order.order_id,
                status=OrdenStatus(order.status),
                total=order.total,
                created_at=order.created_at,
                items=items_response,
                items_count=len(items_response)
            ))
        return orders_response
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener todos los pedidos: {str(e)}"
        )