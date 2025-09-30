from sqlmodel import Session
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.inventory_repository import InventoryRepository
from models.order import Order, OrderItem
from models.product import Product
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, TypedDict

# Definir una estructura para los detalles de items
class OrderItemDetail(TypedDict):
    order_item_id: int
    product_id: int
    product_title: str
    quantity: int
    unit_price: float
    sub_total: float

class BusinessError(Exception):
    pass

class InsufficientStockError(BusinessError):
    def __init__(self, message: str, product_ids: List[int], available_stock: Optional[Dict[int, Dict[str, Any]]] = None):
        self.message = message
        self.product_ids = product_ids
        self.available_stock = available_stock or {}
        self.timestamp = datetime.now(timezone.utc)
        super().__init__(message)
    
class ProductNotFoundError(BusinessError):
    def __init__(self, message: str, product_id: int):
        self.message = message
        self.product_id = product_id
        self.timestamp = datetime.now(timezone.utc)
        super().__init__(message)

def create_order(session:Session, user_id:int, items_data:list[dict]) -> Tuple[Order, List[OrderItemDetail]]:
    try:
        order_repo = OrderRepository(session)
        product_repo = ProductRepository(session)
        total=0.0 
        order = order_repo.create_order(user_id=user_id)
        if order.order_id is None:
            raise BusinessError("No se pudo crear la orden correctamente")
        for item in items_data:
            product=product_repo.get_product_by_id(item["product_id"])
            if not product:
                raise ProductNotFoundError(
                    message=f"Producto con ID {item['product_id']} no encontrado",
                    product_id=item["product_id"]
                )
            unit_price= product.price
            sub_total = unit_price * item["quantity"]
            oi = order_repo.create_order_item(order.order_id,[{ # type: ignore
                "product_id":item["product_id"],
                "quantity":item["quantity"],
                "unit_price":unit_price,
                "sub_total":sub_total
            }])
            total += sub_total
        order.total = total
        session.commit()
        return get_order_details(session, order.order_id)
    except BusinessError as be:
        session.rollback()
        raise be
    except Exception as e:
        session.rollback()
        raise BusinessError(f"Error al crear la orden: {str(e)}")

def validate_order(session:Session, order_id:int) -> Tuple[Order, List[OrderItemDetail]]:
    try:
        order_repo = OrderRepository(session)
        inventory_repo = InventoryRepository(session)
        product_repo = ProductRepository(session)
        order = order_repo.get_order_by_id(order_id)
        if not order:
            raise BusinessError(f"Orden con ID {order_id} no encontrada")
        if order.status != 'draft':
            raise BusinessError(f"Orden con ID {order_id} no está en estado 'draft'")
        order_items = order_repo.get_order_items(order_id)
        insufficient_stock_products = []
        available_stock_info = {}
        for item in order_items:
            effective_quantity = inventory_repo.get_effective_quantity(item.product_id)
            if effective_quantity is None or effective_quantity < item.quantity:
                insufficient_stock_products.append(item.product_id)
                product = product_repo.get_product_by_id(item.product_id)
                if product:
                    available_stock_info[item.product_id] = {
                        "product_id": item.product_id,
                        "product_title": product.title if hasattr(product, 'title') else "Unknown",
                        "available_quantity": effective_quantity or 0,
                        "requested_quantity": item.quantity
                    }
        if insufficient_stock_products:
            products_str = ", ".join(map(str, insufficient_stock_products))
            raise InsufficientStockError(
                message=f"Stock insuficiente para los productos con ID: {products_str}",
                product_ids=insufficient_stock_products,
                available_stock=available_stock_info
            )
        for item in order_items:
            success = inventory_repo.reserve_stock(item.product_id, item.quantity)
            if not success:
                raise BusinessError(f"No se pudo reservar stock para el producto ID {item.product_id}")

        order_repo.update_order_status(order_id, "check")
        session.commit()
        return get_order_details(session, order_id)
    except BusinessError as be:
        session.rollback()
        raise be
    except Exception as e:
        session.rollback()
        raise BusinessError(f"Error al validar la orden: {str(e)}")
    
def confirm_order(session:Session, order_id:int) -> Tuple[Order, List[OrderItemDetail]]:
    try:
        order_repo = OrderRepository(session)
        inventory_repo = InventoryRepository(session)
        order = order_repo.get_order_by_id(order_id)
        if not order:
            raise BusinessError(f"Orden con ID {order_id} no encontrada")
        if order.status != 'confirmed':
            raise BusinessError(f"Orden con ID {order_id} no está en estado 'confirmed'")
        order_items = order_repo.get_order_items(order_id)
        for item in order_items:
            success = inventory_repo.confirm_reservation(item.product_id, item.quantity)
            if not success:
                raise BusinessError(f"No se pudo confirmar la reserva para el producto ID {item.product_id}")
        order_repo.update_order_status(order_id, "completed")
        session.commit()
        return get_order_details(session, order_id)
    except BusinessError as be:
        session.rollback()
        raise be
    except Exception as e:
        session.rollback()
        raise BusinessError(f"Error al confirmar la orden: {str(e)}")


def get_order_details(session: Session, order_id: int) -> Tuple[Order, List[OrderItemDetail]]:
    order_repo = OrderRepository(session)
    product_repo = ProductRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    order_items = order_repo.get_order_items(order_id)
    items_details: List[OrderItemDetail] = []
    
    for item in order_items:
        if item.order_item_id is None:
            raise BusinessError(f"Item de orden con product_id {item.product_id} no tiene ID")
        product = product_repo.get_product_by_id(item.product_id)
        product_title = product.title if product and hasattr(product, 'title') else "Unknown"
        item_detail: OrderItemDetail = {
            "order_item_id": item.order_item_id,
            "product_id": item.product_id,
            "product_title": product_title,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "sub_total": item.sub_total
        }
        items_details.append(item_detail)
    
    return order, items_details

def get_orders_by_user(session: Session, user_id: int, limit: int = 10, offset: int = 0) -> List[Tuple[Order, List[OrderItemDetail]]]:
    order_repo = OrderRepository(session)
    orders = order_repo.get_orders_by_user(user_id, limit, offset)
    orders_with_details = []
    for order in orders:
        if order.order_id is None:
            continue
        items_details = get_order_details(session, order.order_id)[1]
        orders_with_details.append((order, items_details))
    return orders_with_details

def edit_order_item(session: Session , order_id : int , product_id : int , new_quantity : int)-> OrderItem:
    if new_quantity <= 0:
        raise BusinessError("La cantidad debe ser mayor que cero")
    order_repo = OrderRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    if order.status != 'draft':
        raise BusinessError(f"Solo se pueden modificar órdenes en estado 'draft'")
    new_item=order_repo.update_order_item(order_id,product_id,new_quantity)
    if not new_item:
        raise BusinessError(f"Item con product_id {product_id} no encontrado en la orden {order_id}")
    order_items = order_repo.get_order_items(order_id)
    total=0.0
    for item in order_items:
        total += item.sub_total
    order.total = total
    order=order_repo.update_order_status(order_id,'draft')
    return new_item

def delete_order_item(session: Session , order_id : int , product_id : int ) -> bool:
    order_repo = OrderRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    if order.status != 'draft':
        raise BusinessError(f"Solo se pueden modificar órdenes en estado 'draft'")
    success=order_repo.delete_order_item(order_id,product_id)
    if not success:
        raise BusinessError(f"Item con product_id {product_id} no encontrado en la orden {order_id}")
    order_items = order_repo.get_order_items(order_id)
    total=0.0
    for item in order_items:
        total += item.sub_total
    order.total = total
    order=order_repo.update_order_status(order_id,'draft')
    return True

def get_user_orders(session: Session, user_id: int, page: int = 1, page_size: int = 10) -> dict:
    """Get paginated list of orders for a user"""
    import math
    
    order_repo = OrderRepository(session)
    
    # Calculate offset
    offset = (page - 1) * page_size
    
    # Get orders and total count
    orders = order_repo.get_orders_by_user(user_id, limit=page_size, offset=offset)
    total_orders = order_repo.count_orders_by_user(user_id)
    
    # Calculate pagination info
    total_pages = math.ceil(total_orders / page_size) if total_orders > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1
    
    # Build order list with item counts
    order_list = []
    for order in orders:
        order_items = order_repo.get_order_items(order.order_id) # type: ignore
        order_list.append({
            "order_id": order.order_id,
            "status": order.status,
            "total": order.total,
            "created_at": order.created_at,
            "items_count": len(order_items)
        })
    
    return {
        "orders": order_list,
        "total_orders": total_orders,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
        "has_next": has_next,
        "has_previous": has_previous
    }