from pydantic import BaseModel, Field

class ListInventoryResponse(BaseModel):
    product_id: int
    title: str
    author: str
    isbn: str
    price: float
    quantity: int
    reserved: int

class ListInventoryUpdateResponse(BaseModel):
    title: str
    quantity: int