from sqlmodel import Session
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.inventory_repository import InventoryRepository
from models.order import Order, OrderItem
import math
from models.product import Product
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, TypedDict
from io import BytesIO
from reportlab.lib.pagesizes import letter, A4
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from reportlab.lib.units import inch
from repositories.user_repository import UserRepository
from repositories.product_repository import ProductRepository
import os

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
        if order.status != 'check':
            raise BusinessError(f"Orden con ID {order_id} no está en estado 'check'")
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

def get_order_by_id(session: Session, order_id: int) -> Order:
    order_repo = OrderRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    return order

def edit_order_item(session: Session , order_id : int , product_id : int , new_quantity : int)-> OrderItem:
    if new_quantity <= 0:
        raise BusinessError("La cantidad debe ser mayor que cero")
    order_repo = OrderRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    if order.status != 'draft' and order.status != 'check':
        raise BusinessError(f"Solo se pueden modificar órdenes en estado 'draft' o 'check'")
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
    if order.status != 'draft' and order.status != 'check':
        raise BusinessError(f"Solo se pueden modificar órdenes en estado 'draft' o 'check' ")
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
    order_repo = OrderRepository(session)
    offset = (page - 1) * page_size
    orders = order_repo.get_orders_by_user(user_id, limit=page_size, offset=offset)
    total_orders = order_repo.count_orders_by_user(user_id)
    total_pages = math.ceil(total_orders / page_size) if total_orders > 0 else 0
    has_next = page < total_pages
    has_previous = page > 1
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
    
def cancel_order(session: Session, order_id:int) -> Order:
    order_repo = OrderRepository(session)
    inventory_repo = InventoryRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    if order.status != 'check' and order.status != 'draft':
        raise BusinessError(f"Solo se pueden cancelar órdenes en estado 'check' o 'draft'")
    order_items = order_repo.get_order_items(order_id)
    if order.status == 'check':
        for item in order_items:
            success_1 = inventory_repo.release_reserved_stock(item.product_id, item.quantity)
            if not success_1:
                raise BusinessError(f"No se pudo liberar la reserva para el producto ID {item.product_id}")
    for item in order_items:
        success_2 = order_repo.delete_order_item(item.order_id, item.product_id)
        if not success_2:
            raise BusinessError(f"No se pudo eliminar el item con product_id {item.product_id} de la orden {order_id}")
    order_repo.update_order_status(order_id, "canceled")
    session.commit()
    return order

def add_order_item(session: Session, order_id: int, product_id: int , quantity: int)-> list[OrderItem]:
    order_repo = OrderRepository(session)
    product_repo = ProductRepository(session)
    order = order_repo.get_order_by_id(order_id)
    if not order:
        raise BusinessError(f"Orden con ID {order_id} no encontrada")
    if order.status != 'draft' and order.status != 'check':
        raise BusinessError(f"Solo se pueden modificar órdenes en estado 'draft' o 'check'")
    product=product_repo.get_product_by_id(product_id)
    if not product:
        raise ProductNotFoundError(
            message=f"Producto con ID {product_id} no encontrado",
            product_id=product_id
        )
    unit_price= product.price
    sub_total = unit_price * quantity
    oi = order_repo.create_order_item(order.order_id,[{ # type: ignore
        "product_id":product_id,
        "quantity":quantity,
        "unit_price":unit_price,
        "sub_total":sub_total
    }])
    order.total += sub_total
    order=order_repo.update_order_status(order_id,'draft')
    return oi

def get_order_pdf(session: Session, order_id: int):
    """
    Genera un PDF para la orden.
    """
    try:
        user_repo = UserRepository(session)
        product_repo = ProductRepository(session)
        order, order_details = get_order_details(session, order_id)
        customer = user_repo.get_user_by_id(order.user_created)
        if not order:
            return None
        buffer = BytesIO()
        c = canvas.Canvas(buffer, pagesize=A4)
        width, height = A4
        primary_color = colors.Color(0.149, 0.388, 0.918)
        text_color = colors.Color(0.122, 0.161, 0.216) 
        light_gray = colors.Color(0.953, 0.957, 0.965)
        logo_path = os.path.join(os.path.dirname(__file__), '..', 'media', 'libco_logo.png')
        if os.path.exists(logo_path):
            try:
                c.drawImage(logo_path, (width - 150) / 2, height - 120, width=150, height=60, preserveAspectRatio=True)
            except Exception as e:
                print(f"Error cargando logo: {e}")
                c.setFont("Helvetica-Bold", 20)
                c.setFillColor(primary_color)
                c.drawString((width - c.stringWidth("LIBCO", "Helvetica-Bold", 20)) / 2, height - 80, "📚 LIBCO")
        c.setFont("Helvetica-Bold", 18)
        c.setFillColor(primary_color)
        if order.status == "canceled":
            title_text = "Comprobante de orden cancelada"
        else:
            title_text = "Recibo de Orden de Compra"
        title_width = c.stringWidth(title_text, "Helvetica-Bold", 18)
        c.drawString((width - title_width) / 2, height - 150, title_text)
        box_y = height - 200
        box_height = 120
        c.setFillColor(light_gray)
        c.rect(50, box_y - box_height, width - 100, box_height, fill=1, stroke=0)
        c.setStrokeColor(primary_color)
        c.setLineWidth(2)
        c.rect(50, box_y - box_height, width - 100, box_height, fill=0, stroke=1)
        c.setFillColor(text_color)
        c.setFont("Helvetica-Bold", 12)
        info_x = 70
        info_y = box_y - 25
        c.drawString(info_x, info_y, f"Orden: #{order.order_id}")
        c.drawString(info_x + 200, info_y, f"Fecha: {order.created_at.strftime('%d/%m/%Y')}")  
        c.drawString(info_x, info_y - 20, f"Cliente: {customer.name} {customer.last_name}")
        c.drawString(info_x + 200, info_y - 20, f"{customer.email}")
        status_text = _get_status_display(order.status)
        status_color = _get_status_color(order.status)
        c.setFillColor(status_color)
        c.drawString(info_x, info_y - 40, f"Estado: {status_text}")
        c.setFillColor(text_color)
        c.drawString(info_x + 200, info_y - 40, f"ID: #{customer.ID}")
        table_y = height - 350
        c.setFillColor(primary_color)
        c.rect(50, table_y, width - 100, 25, fill=1)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 11)
        c.drawString(70, table_y + 8, "Producto")
        c.drawString(350, table_y + 8, "Cantidad")
        c.drawString(420, table_y + 8, "Precio Unit.")
        c.drawString(490, table_y + 8, "Subtotal")
        y_pos = table_y - 5
        c.setFillColor(text_color)
        c.setFont("Helvetica", 10)
        total_items = 0
        if order.status == "canceled":
            c.setFillColor(colors.red)
            c.setFont("Helvetica-Bold", 16)
            canceled_text = "¡ORDEN CANCELADA!"
            canceled_width = c.stringWidth(canceled_text, "Helvetica-Bold", 16)
            c.drawString((width - canceled_width) / 2, y_pos - 30, canceled_text)
            y_pos -= 40
        else:
            for i, item in enumerate(order_details):
                y_pos -= 20
                product = product_repo.get_product_by_id(item['product_id'])
                product_name = product.title if product and hasattr(product, 'title') else item['product_title']
                if i % 2 == 0:
                    c.setFillColor(colors.Color(0.99, 0.99, 0.99))
                    c.rect(50, y_pos - 2, width - 100, 16, fill=1, stroke=0)
                c.setFillColor(text_color)
                if len(product_name) > 35:
                    product_name = product_name[:32] + "..."
                c.drawString(70, y_pos, product_name)
                c.drawString(360, y_pos, str(item['quantity']))
                c.drawString(420, y_pos, f"${item['unit_price']:,.0f}")
                c.drawString(490, y_pos, f"${item['sub_total']:,.0f}")
                total_items += item['quantity']
            total_y = y_pos - 40
            c.setFillColor(colors.Color(0.023, 0.722, 0.412))  # Verde #059669
            c.rect(350, total_y - 5, 200, 30, fill=1)
            c.setFillColor(colors.white)
            c.setFont("Helvetica-Bold", 14)
            c.drawString(360, total_y + 8, f"TOTAL: ${order.total:,.0f} COP")
            c.setFillColor(text_color)
            c.setFont("Helvetica", 10)
            c.drawString(360, total_y - 20, f"Total items: {total_items}")
        c.setFont("Helvetica", 9)
        c.setFillColor(colors.Color(0.4, 0.4, 0.4))
        footer_y = 80
        footer_text_1 = "¡Gracias por confiar en LibCo!"
        footer_width_1 = c.stringWidth(footer_text_1, "Helvetica", 9)
        c.drawString((width - footer_width_1) / 2, footer_y, footer_text_1)
        footer_text_2 = f"Generado el {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        footer_width_2 = c.stringWidth(footer_text_2, "Helvetica", 9)
        c.drawString((width - footer_width_2) / 2, footer_y - 15, footer_text_2)
        footer_text_3 = "LibCo - Sistema de Gestión de Libros"
        footer_width_3 = c.stringWidth(footer_text_3, "Helvetica", 9)
        c.drawString((width - footer_width_3) / 2, footer_y - 30, footer_text_3)

        c.showPage()
        c.save()
        buffer.seek(0)
        return buffer

    except Exception as e:
        print(f"Error generando PDF: {e}")
        return None


def _get_status_display(status: str) -> str:
    """Convierte el status a texto amigable."""
    status_map = {
        'draft': 'Borrador',
        'check': 'En Validación', 
        'completed': 'Completado',
        'canceled': 'Cancelado'
    }
    return status_map.get(status, status.title())

def _get_status_color(status: str):
    """Retorna color según el estado."""
    color_map = {
        'draft': colors.Color(0.945, 0.624, 0.043),
        'check': colors.Color(0.149, 0.388, 0.918),
        'completed': colors.Color(0.023, 0.722, 0.412), 
        'canceled': colors.Color(0.937, 0.267, 0.267)  
    }
    return color_map.get(status, colors.Color(0.4, 0.4, 0.4))