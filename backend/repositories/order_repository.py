from typing import Optional
from sqlmodel import Session, select
from sqlalchemy import desc
from datetime import datetime, timezone
from models.order import Order, OrderItem

class OrderRepository:
    def __init__(self,session: Session):
        self.session = session
    
    def create_order(self,user_id:int,total:float=0.0,status:str='draft') -> Order:
        """Create a new order"""
        order = Order(
            user_created=user_id,
            total=total,
            status=status,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        self.session.add(order)
        self.session.commit()
        self.session.refresh(order)
        return order
    
    def create_order_item(self,order_id:int,items_data:list[dict]) -> list[OrderItem]:
        order_items = []
        for item in items_data:
            order_item=OrderItem(
                order_id=order_id,
                product_id=item["product_id"],
                quantity = item["quantity"],
                unit_price = item["unit_price"],
                sub_total = item["sub_total"],
                created_at = datetime.now(timezone.utc),
                updated_at = datetime.now(timezone.utc)
            )
            self.session.add(order_item)
            order_items.append(order_item)
        self.session.flush()
        return order_items
    
    def get_order_by_id(self, order_id:int) -> Optional[Order]:
        statement = select(Order).where(Order.order_id == order_id)
        return self.session.exec(statement).first()
    
    def update_order_status(self,order_id:int, new_status:str) -> Optional[Order]:
        order = self.get_order_by_id(order_id)
        if order:
            order.status = new_status
            order.updated_at = datetime.now(timezone.utc)
            self.session.add(order)
            self.session.commit()
            self.session.refresh(order)
        return order
    
    def get_order_items(self, order_id: int) -> list[OrderItem]:
        statement = select(OrderItem).where(OrderItem.order_id == order_id)
        return list(self.session.exec(statement).all())

    def get_orders_by_user(self, user_id:int, limit:int=10, offset:int=0) -> list[Order]:
        statement = (
            select(Order)
            .where(Order.user_created == user_id)
            .order_by(Order.created_at.desc()) # type: ignore
            .limit(limit)
            .offset(offset)
        )
        return list(self.session.exec(statement).all())
    
    def count_orders_by_user(self, user_id: int) -> int:
        """Count total orders for a user"""
        from sqlalchemy import func
        statement = select(func.count(Order.order_id)).where(Order.user_created == user_id)
        result = self.session.exec(statement).first()
        return result or 0
    
    def update_order_item(self,order_id:int,product_id:int, new_quantity:int) -> Optional[OrderItem]:
        statement = select(OrderItem).where(
            OrderItem.order_id == order_id,
            OrderItem.product_id == product_id
        )
        order_item = self.session.exec(statement).first()
        if order_item:
            order_item.quantity = new_quantity
            order_item.sub_total = order_item.unit_price * new_quantity
            order_item.updated_at = datetime.now(timezone.utc)
            self.session.add(order_item)
            self.session.commit()
            self.session.refresh(order_item)
        return order_item
    
    def delete_order_item(self,order_id:int,product_id:int) -> bool:
        statement = select(OrderItem).where(
            OrderItem.order_id == order_id,
            OrderItem.product_id == product_id
        )
        order_item = self.session.exec(statement).first()
        if order_item:
            self.session.delete(order_item)
            self.session.commit()
            return True
        return False        