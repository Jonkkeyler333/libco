from pydantic import BaseModel, Field

class InventoryResponse(BaseModel):
    product_id: int
    sku: str
    title: str
    author: str
    price: float
    quantity: int
    reserved: int