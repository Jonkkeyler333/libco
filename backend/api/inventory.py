from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlmodel import select
from models.product import Product
from models.inventory import Inventory
from db.database import get_session
from models.user import User
from api.auth import get_current_user

router = APIRouter(prefix="/inventory", tags=["inventory"])

@router.get("/", response_model=List[dict])
def list_inventory(
    sku: Optional[str] = Query(None),
    title: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    session=Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    query = select(Product, Inventory).join(Inventory, Inventory.product_id == Product.product_id)
    if sku:
        query = query.where(Product.sku == sku)
    if title:
        query = query.where(Product.title.ilike(f"%{title}%"))
    if product_id:
        query = query.where(Product.product_id == product_id)

    results = session.exec(query).all()
    inventory_list = []
    for product, inventory in results:
        inventory_list.append({
            "product_id": product.product_id,
            "sku": product.sku,
            "title": product.title,
            "author": product.author,
            "price": product.price,    
            "quantity": inventory.quantity,
            "reserved": inventory.reserved
        })

    return inventory_list