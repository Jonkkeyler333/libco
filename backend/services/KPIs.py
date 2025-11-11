from sqlmodel import Session
from repositories.order_repository import OrderRepository
from repositories.product_repository import ProductRepository
from repositories.inventory_repository import InventoryRepository
from models.order import Order, OrderItem
import math
from models.product import Product
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional, Tuple, TypedDict

def total_sales_period(session:Session, start_date:datetime, end_date:datetime) -> Tuple[float,int,float]:
    order_repo = OrderRepository(session)
    orders = order_repo.get_order_by_period(start_date,end_date)
    total_orders = len(orders)
    orders = [order for order in orders if order.status == 'completed']
    total_sales = sum(order.total for order in orders)
    avg_order_value = total_sales / len(orders) if orders else 0
    return total_sales, total_orders, avg_order_value

def order_status_counts(session:Session,start_date:datetime,end_date:datetime):
    order_repo = OrderRepository(session)
    statuses = ['draft','check','completed','canceled']
    orders=order_repo.get_order_by_period(start_date,end_date)
    status_counts = {status: 0 for status in statuses}
    for order in orders:
        if order.status in status_counts:
            status_counts[order.status] += 1
    return status_counts
    