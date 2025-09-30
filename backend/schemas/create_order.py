from pydantic import BaseModel, Field
from typing import ClassVar, List
from datetime import datetime , timezone
from enum import Enum

class OrdenStatus(str,Enum):
    """Represents the status of an order.

    :param str: _status_
    :type str: _str_
    """
    DRAFT="draft"
    CHECK="check"
    COMPLETED="completed"
    CANCELED="canceled"

class CreateItemRequest(BaseModel):
    """Request model for creating an item in an order.
    """
    product_id : int = Field(..., gt=0, description="ID of the product to order")
    quantity : int = Field(..., gt=0, description="Quantity of the product to order")

    class Config:
        schema_extra={"example": 
                { "product_id": 1,"quantity": 2}
            }   
        
class CreateOrderRequest(BaseModel):
    """Request model for creating an order with multiple items.
    """
    items: List[CreateItemRequest] = Field(..., description="List of items to order")
    class Config:
        schema_extra = {
            "example": {
                "items": [
                    {"product_id": 1, "quantity": 2},
                    {"product_id": 2, "quantity": 1}
                ]
            }
        }
        
class OrderItemResponse(BaseModel):
    """Response model for an item in an order.
    """
    order_item_id : int 
    product_id : int = Field(..., description="ID of the product")
    product_title : str = Field(..., description="Title of the book")
    quantity : int = Field (..., description="Quantity of the product",gt=0)
    unit_price : float = Field(..., description="Unit price of the product",gt=0)
    sub_total : float = Field(..., description="Subtotal price for the item (quantity * unit_price)",gt=0)

class CreateOrderResponse(BaseModel):
    """Response model for an order creation.
    """
    order_id: int
    status: OrdenStatus = Field(default=OrdenStatus.DRAFT)
    total: float = Field(gt=0)
    items: List[OrderItemResponse] = Field(..., description="List of items in the order")
    created_at: datetime
    items_count: int = Field(..., description="Total number of distinct items in the order", gt=0)
    message: str = Field(..., description="Order creation message")
    next_step: str = Field(default="Confirm order",description="Next step in the order process")
    class Config:
        schema_extra = {
            "example": {
                "order_id": 1,
                "status": "draft",
                "total": 100.00,
                "items": [
                    {"order_item_id": 1, "product_id": 1, "product_title": "Book A", "quantity": 2, "unit_price": 30.00, "sub_total": 60.00},
                    {"order_item_id": 2, "product_id": 2, "product_title": "Book B", "quantity": 1, "unit_price": 40.00, "sub_total": 40.00}
                ],
                "created_at": "2023-01-01T00:00:00Z",
                "items_count": 2,
                "message": "Order created successfully",
                "next_step": "Confirm order"
            }
        }

class InsufficientStockError(BaseModel):
    """Error model for insufficient stock when creating an order.
    """
    detail: str
    error_code: str = "INSUFFICIENT_STOCK"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="Timestamp of the error occurrence") # type: ignore
    available_stock: dict = Field(..., description="Información del stock disponible")
    class Config:
        schema_extra = {
            "example": {
                "detail": "Stock insuficiente para producto 'Clean Code'. Disponible: 1, Solicitado: 2",
                "error_code": "INSUFFICIENT_STOCK",
                "timestamp": "2024-01-15T10:30:00Z",
                "available_stock": {
                    "product_id": 1,
                    "product_title": "Clean Code",
                    "available_quantity": 1,
                    "requested_quantity": 2
                }
            }
        }

class ProductNotFoundError(BaseModel):
    """Error model for product not found when creating an order.
    """
    detail: str
    error_code: str = "PRODUCT_NOT_FOUND"
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat(), description="Timestamp of the error occurrence") # type: ignore
    product_id: int
    class Config:
        schema_extra = {
            "example": {
                "detail": "Producto con ID 999 no encontrado",
                "error_code": "PRODUCT_NOT_FOUND",
                "timestamp": "2024-01-15T10:30:00Z",
                "product_id": 999
            }
        }
        
class EditOrderItemRequest(BaseModel):
    """Request model for editing an item in an order.
    """
    quantity: int = Field(..., gt=0, description="New quantity of the product in the order")
    class Config:
        schema_extra={"example": 
                {"quantity": 3}
            }