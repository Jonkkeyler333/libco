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

# def top_selling_products(session:Session, start_date:datetime, end_date:datetime, limit:int=5)->Dict[str,int]:
#     producto_repo=ProductRepository(session)
#     inventory_repo=InventoryRepository(session)
#     inventories=inventory_repo.get_reserved_inventory_by_period(start_date,end_date)
#     product_ids, reserved_quantities = inventories
#     if len(product_ids)>limit:
#         product_ids=product_ids[:limit]
#         reserved_quantities=reserved_quantities[:limit]
#     products = {}
#     for i,product in enumerate(product_ids):
#         prod = producto_repo.get_product_by_id(product)
#         if prod:
#             products[prod.title]=reserved_quantities[i]
#         else :
#             products[f"Producto ID {product}"]=reserved_quantities[i]
#     return products

def top_selling_products(session:Session, start_date:datetime, end_date:datetime, limit:int=5)->Dict[str,int]:
    order_repo=OrderRepository(session)
    product_repo=ProductRepository(session)
    orders = order_repo.get_order_by_period(start_date, end_date)
    order_item = list()
    for order in orders:
        if order.status == 'completed':
            items = order_repo.get_order_items(order.order_id)
            product_quantities = list()
            for item in items:
                product = product_repo.get_product_by_id(item.product_id)
                if product:
                    product_quantities.append({"title": product.title, "quantity": item.quantity})
            order_item.append({"order_id": order.order_id, "items": product_quantities})
    products={}
    for order in order_item:
        for item in order["items"]:
            if item["title"] in products:
                products[item["title"]] += item["quantity"]
            else:
                products[item["title"]] = item["quantity"]
    if len(products) > limit:
        sorted_products = dict(sorted(products.items(), key=lambda x: x[1], reverse=True)[:limit])
        return sorted_products
    return products