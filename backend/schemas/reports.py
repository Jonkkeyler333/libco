from pydantic import BaseModel, Field, ConfigDict
from typing import ClassVar, List, Dict
from datetime import datetime , timezone

class GetKPIsRequest(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "start_date": "2024-01-01T00:00:00Z",
                "end_date": "2024-01-31T23:59:59Z"
            }
        }
    )
    start_date: datetime
    end_date: datetime

class KPIsResponse(BaseModel):
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "total_sales": 12500.75,
                "total_orders": 150,
                "average_order_value": 83.34,
                "order_status_counts": {
                    "draft": 20,
                    "check": 30,
                    "confirmed": 90,
                    "cancelled": 10
                },
                "top_selling_products": {
                    "Product A": 50,
                    "Product B": 30,
                    "Product C": 20
                }
            }
        }
    )
    total_sales: float = Field(..., description="Total sales amount in the period")
    total_orders: int = Field(..., description="Total number of orders in the period")
    average_order_value: float = Field(..., description="Average value per order in the period")
    order_status_counts: Dict[str, int] = Field(..., description="Counts of orders by status in the period")
    top_selling_products: Dict[str, int] = Field(..., description="Top selling products in the period")