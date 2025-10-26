from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlmodel import select
from models.product import Product
from models.inventory import Inventory
from db.database import get_session
from models.user import User
from api.auth import get_current_user
from schemas.inventory import ListInventoryResponse, ListInventoryUpdateResponse
from datetime import datetime, timezone

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=List[ListInventoryResponse])
def list_inventory(
    title: Optional[str] = Query(None),
    isbn: Optional[str] = Query(None),
    session=Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    query = select(Product, Inventory).join(Inventory, Inventory.product_id == Product.product_id)

    if title:
        query = query.where(Product.title.ilike(f"%{title}%"))
    if isbn:
        query = query.where(Product.isbn.ilike(f"%{isbn}%"))

    results = session.exec(query).all()
    inventory_list = []

    for product, inventory in results:
        inventory_list.append(ListInventoryResponse(
            product_id=product.product_id,
            title=product.title,
            author=product.author,
            isbn=product.isbn,
            price=product.price,
            quantity=inventory.quantity,
            reserved=inventory.reserved
        ))
    sorted_inventory_list = sorted(inventory_list, key=lambda x: x.title)
    return sorted_inventory_list

@router.put("/adjust-many", response_model=List[ListInventoryUpdateResponse])
def update_inventory(
    updates: List[dict],
    session=Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    responses = []
    for item in updates:
        product_id = item.get("product_id")
        quantity = item.get("quantity")

        inventory = session.get(Inventory, product_id)
        if not inventory:
            continue  # o lanzar error si prefieres detener todo

        inventory.quantity = quantity
        inventory.last_updated = datetime.now(timezone.utc)
        session.add(inventory)
        session.commit()
        session.refresh(inventory)

        product = session.get(Product, product_id)
        responses.append(
            ListInventoryUpdateResponse(
                title=product.title,
                quantity=inventory.quantity
            )
        )

    return responses