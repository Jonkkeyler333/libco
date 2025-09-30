from pydantic import BaseModel, Field
from typing import ClassVar, List
from datetime import datetime , timezone
from enum import Enum

class ProductBase(BaseModel):
    """Base model for a product.
    """
    product_id: int 
    title: str 
    author: str 
    isbn: str 
    format: str 
    edition: str 
    language: str
    publisher: str
    publication_year: int
    description : str
    price: float
    pages: int
    currency: str
    weight: float 
    dimensions: str
    front_page_url: str 
    class Config:
        schema_extra = {
            "example": {
                "product_id": 1,
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald",
                "isbn": "9780743273565",
                "format": "paperback",
                "edition": "1st",
                "description": "A novel set in the Roaring Twenties.",
                "language": "en",
                "publisher": "Scribner",
                "publication_year": 2004,
                "price": 10.99,
                "pages": 180,
                "currency": "USD",
                "weight": 0.5,
                "dimensions": "5x8x1",
                "front_page_url": "http://example.com/great_gatsby.jpg"
            }
        }

class ProductsResponse(BaseModel):
    """Response model for a list of products.
    """
    products: List[ProductBase] = Field(..., description="List of products")