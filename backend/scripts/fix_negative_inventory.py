"""
Script para corregir cantidades negativas en la columna 'reserved' de la tabla inventory.
Este script restablece todos los valores negativos a cero.
"""

import sys
import os
from datetime import datetime, timezone
from sqlmodel import Session, select

# Añadir el directorio raíz del proyecto al path para poder importar
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from db.database import engine
from models.inventory import Inventory

def fix_negative_inventory():
    """Corrige los valores negativos en la columna reserved de la tabla inventory."""
    with Session(engine) as session:
        # Buscar todos los registros con reserved < 0
        statement = select(Inventory).where(Inventory.reserved < 0)
        negative_inventories = session.exec(statement).all()
        
        print(f"Se encontraron {len(negative_inventories)} registros con reserved negativo")
        
        # Corregir cada registro
        for inventory in negative_inventories:
            print(f"Corrigiendo inventory_id={inventory.inventory_id}, product_id={inventory.product_id}, reserved={inventory.reserved} -> 0")
            inventory.reserved = 0
            inventory.last_updated = datetime.now(timezone.utc)
            session.add(inventory)
        
        # Guardar los cambios
        session.commit()
        print("Correcciones completadas")

if __name__ == "__main__":
    fix_negative_inventory()