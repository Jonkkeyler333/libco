from typing import Optional
from sqlmodel import Session, select
from sqlalchemy import desc
from datetime import datetime, timezone
from models.inventory import Inventory

class InventoryRepository:
    def __init__(self, session: Session):
        self.session = session

    def get_inventory_by_product_id(self, product_id: int) -> Optional[Inventory]:
        statement = select(Inventory).where(Inventory.product_id == product_id)
        return self.session.exec(statement).first()

    def update_inventory(self, product_id: int, quantity: int, reserved: int) -> Optional[Inventory]:
        inventory = self.get_inventory_by_product_id(product_id)
        if inventory:
            inventory.quantity = quantity
            inventory.reserved = reserved
            inventory.last_updated = datetime.now(timezone.utc)
            self.session.add(inventory)
            self.session.commit()
            self.session.refresh(inventory)
        return inventory
    
    def reserve_stock(self, product_id: int, amount: int) -> bool:
        inventory = self.get_inventory_by_product_id(product_id)
        if inventory: ##Evitar reglas de negocio en el repositorio
            inventory.reserved += amount
            inventory.last_updated = datetime.now(timezone.utc)
            self.session.add(inventory)
            self.session.commit()
            self.session.refresh(inventory)
            return True
        return False
    
    def confirm_reservation(self, product_id: int, amount: int) -> bool:
        inventory = self.get_inventory_by_product_id(product_id)
        if inventory and inventory.reserved >= amount:
            inventory.reserved -= amount
            inventory.quantity -= amount
            inventory.last_updated = datetime.now(timezone.utc)
            self.session.add(inventory)
            self.session.commit()
            self.session.refresh(inventory)
            return True
        return False

    def create_inventory(self, product_id: int, quantity: int = 0, reserved: int = 0) -> Inventory:
        inventory = Inventory(
            product_id=product_id,
            quantity=quantity,
            reserved=reserved,
            last_updated=datetime.now(timezone.utc)
        )
        self.session.add(inventory)
        self.session.commit()
        self.session.refresh(inventory)
        return inventory
    
    def get_effective_quantity(self, product_id: int) -> Optional[int]:
        inventory = self.get_inventory_by_product_id(product_id)
        if inventory:
            return inventory.quantity - inventory.reserved
        return None
