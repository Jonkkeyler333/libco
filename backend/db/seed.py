from .database import get_session
from sqlmodel import select
from models.user import User, UserRole
from models.product import Product
from models.inventory import Inventory
from models.category import Category, CategoryProductLink
import hashlib
from datetime import datetime, timezone

from passlib.context import CryptContext

# Usar la misma configuración que en auth_service.py
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using the same method as in auth_service"""
    return pwd_context.hash(password)

def seed_database():
    """Seed the database with initial data"""
    session = next(get_session())
    
    # Seed categories
    categories = [
        {"category_id": 1, "name": "Filosofía", "description": "Libros de filosofía"},
        {"category_id": 2, "name": "Ciencias de la Computación", "description": "Libros de ciencias de la computación"},
        {"category_id": 3, "name": "Novela", "description": "Novelas literarias"},
        {"category_id": 4, "name": "Matemáticas", "description": "Libros de matemáticas"}
    ]
    
    for cat_data in categories:
        if not session.exec(select(Category).filter(Category.name == cat_data["name"])).first():
            category = Category(**cat_data)
            session.add(category)
    
    session.commit()
    
    # Crear usuarios de prueba
    users = [
        {
            "username": "admin",
            "email": "admin@libco.com",
            "ID": 1001,
            "name": "Admin",
            "last_name": "User",
            "password_hash": hash_password("admin123"),
            "role": UserRole.ADMIN,
            "is_active": True
        },
        {
            "username": "usuario1",
            "email": "usuario1@example.com",
            "ID": 1002,
            "name": "Juan",
            "last_name": "Pérez",
            "password_hash": hash_password("usuario123"),
            "role": UserRole.USER,
            "is_active": True
        },
        {
            "username": "usuario2",
            "email": "usuario2@example.com",
            "ID": 1003,
            "name": "María",
            "last_name": "González",
            "password_hash": hash_password("usuario123"),
            "role": UserRole.USER,
            "is_active": True
        },
        {
            "username": "usuario3",
            "email": "usuario3@example.com",
            "ID": 1004,
            "name": "Carlos",
            "last_name": "Rodríguez",
            "password_hash": hash_password("usuario123"),
            "role": UserRole.USER,
            "is_active": True
        }
    ]
    
    for user_data in users:
        if not session.exec(select(User).filter(User.username == user_data["username"])).first():
            user = User(**user_data)
            session.add(user)
    
    session.commit()
    
    # Seed products (books)
    products = [
        # Libros de Filosofía
        {
            "product_id": 1,
            "sku": "FIL-001",
            "title": "El mundo de Sofía",
            "author": "Jostein Gaarder",
            "isbn": "9788478448500",
            "format": "paperback",
            "edition": "1st",
            "description": "Novela sobre la historia de la filosofía",
            "language": "es",
            "publisher": "Siruela",
            "publication_year": 1991,
            "price": 75000.0,
            "pages": 638,
            "currency": "COP",
            "weight": 0.7,
            "dimensions": "15x23x3",
            "front_page_url": "https://www.tornamesa.co/imagenes/9788498/978849841170.GIF"
        },
        {
            "product_id": 2,
            "sku": "FIL-002",
            "title": "Ética a Nicómaco",
            "author": "Aristóteles",
            "isbn": "9788430943425",
            "format": "hardcover",
            "edition": "3rd",
            "description": "Obra clásica sobre ética y moral",
            "language": "es",
            "publisher": "Gredos",
            "publication_year": 1985,
            "price": 65000.0,
            "pages": 320,
            "currency": "COP",
            "weight": 0.5,
            "dimensions": "13x21x2",
            "front_page_url": "https://m.media-amazon.com/images/I/4189G-gaGEL._SY445_SX342_QL70_ML2_.jpg"
        },
        {
            "product_id": 3,
            "sku": "FIL-003",
            "title": "Así habló Zaratustra",
            "author": "Friedrich Nietzsche",
            "isbn": "9788420637204",
            "format": "paperback",
            "edition": "2nd",
            "description": "Obra filosófica que introduce el concepto del superhombre",
            "language": "es",
            "publisher": "Alianza Editorial",
            "publication_year": 1972,
            "price": 68000.0,
            "pages": 384,
            "currency": "COP",
            "weight": 0.6,
            "dimensions": "14x22x2.5",
            "front_page_url": "https://pictures.abebooks.com/inventory/md/md31403665059.jpg"
        },
        
        # Libros de Ciencias de la Computación
        {
            "product_id": 4,
            "sku": "COMP-001",
            "title": "Clean Code",
            "author": "Robert C. Martin",
            "isbn": "9780132350884",
            "format": "paperback",
            "edition": "1st",
            "description": "Guía para escribir código limpio y mantenible",
            "language": "en",
            "publisher": "Prentice Hall",
            "publication_year": 2008,
            "price": 120000.0,
            "pages": 464,
            "currency": "COP",
            "weight": 0.8,
            "dimensions": "17x23x3",
            "front_page_url": "https://images.cdn1.buscalibre.com/fit-in/360x360/87/da/87da3d378f0336fd04014c4ea153d064.jpg"
        },
        {
            "product_id": 5,
            "sku": "COMP-002",
            "title": "Introduction to Algorithms",
            "author": "Thomas H. Cormen",
            "isbn": "9780262033848",
            "format": "hardcover",
            "edition": "3rd",
            "description": "El libro de referencia sobre algoritmos",
            "language": "en",
            "publisher": "MIT Press",
            "publication_year": 2009,
            "price": 160000.0,
            "pages": 1312,
            "currency": "COP",
            "weight": 2.5,
            "dimensions": "20x25x5",
            "front_page_url": "https://images.cdn1.buscalibre.com/fit-in/360x360/ce/4d/ce4daab00e405bca345cfbbf20b5c8df.jpg"
        },
        {
            "product_id": 6,
            "sku": "COMP-003",
            "title": "Design Patterns",
            "author": "Erich Gamma",
            "isbn": "9780201633610",
            "format": "hardcover",
            "edition": "1st",
            "description": "Elementos reusables de software orientado a objetos",
            "language": "en",
            "publisher": "Addison-Wesley",
            "publication_year": 1994,
            "price": 135000.0,
            "pages": 416,
            "currency": "COP",
            "weight": 0.9,
            "dimensions": "18x24x3",
            "front_page_url": "https://imagessl8.casadellibro.com/a/l/s7/98/9788478290598.webp"
        }
    ]
    
    for product_data in products:
        if not session.exec(select(Product).filter(Product.sku == product_data["sku"])).first():
            product = Product(**product_data)
            session.add(product)
    
    session.commit()
    
    # Asignar categorías a los productos
    product_categories = [
        {"product_id": 1, "category_id": 1},  # El mundo de Sofía - Filosofía
        {"product_id": 2, "category_id": 1},  # Ética a Nicómaco - Filosofía
        {"product_id": 3, "category_id": 1},  # Así habló Zaratustra - Filosofía
        {"product_id": 4, "category_id": 2},  # Clean Code - Ciencias de la Computación
        {"product_id": 5, "category_id": 2},  # Introduction to Algorithms - Ciencias de la Computación
        {"product_id": 5, "category_id": 4},  # Introduction to Algorithms - Matemáticas (categoría múltiple)
        {"product_id": 6, "category_id": 2}   # Design Patterns - Ciencias de la Computación
    ]
    
    for link_data in product_categories:
        # Using SQLModel's filter directly without and_
        if not session.exec(
            select(CategoryProductLink).where(
                (CategoryProductLink.product_id == link_data["product_id"]) & 
                (CategoryProductLink.category_id == link_data["category_id"])
            )
        ).first():
            link = CategoryProductLink(**link_data)
            session.add(link)
    
    session.commit()
    
    from datetime import datetime, timezone
    
    inventory_items = [
        {"product_id": 1, "quantity": 25, "reserved": 0},  # El mundo de Sofía
        {"product_id": 2, "quantity": 15, "reserved": 0},  # Ética a Nicómaco
        {"product_id": 3, "quantity": 20, "reserved": 0},  # Así habló Zaratustra
        {"product_id": 4, "quantity": 30, "reserved": 0},  # Clean Code
        {"product_id": 5, "quantity": 10, "reserved": 0},  # Introduction to Algorithms
        {"product_id": 6, "quantity": 18, "reserved": 0}   # Design Patterns
    ]
    
    for inv_data in inventory_items:
        product_id = inv_data.pop("product_id")
        existing_inventory = session.exec(select(Inventory).where(Inventory.product_id == product_id)).first()
        if not existing_inventory:
            product = session.exec(select(Product).where(Product.product_id == product_id)).first()
            if product:
                inventory = Inventory(
                    product_id=product_id,
                    product=product,
                    quantity=inv_data["quantity"],
                    reserved=inv_data["reserved"],
                    last_updated=datetime.now(timezone.utc)
                )
                session.add(inventory)    
    session.commit()
    
    # Seed some sample orders for testing US-06
    from models.order import Order
    from models.order_item import OrderItem
    
    # Get the actual user_id for usuario1 from the database (existing user)
    usuario1 = session.exec(select(User).where(User.username == "usuario1")).first()
    if not usuario1:
        print("⚠️  Warning: usuario1 not found, skipping order creation")
        return
    
    user_id = usuario1.user_id
    print(f"📋 Creating sample orders for user_id: {user_id} (usuario1)")
    
    # Create some sample orders for usuario1
    sample_orders = [
        {
            "user_created": user_id,
            "total": 195000.0,  # 75000 + 120000
            "status": "completed",
            "created_at": datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            "items": [
                {"product_id": 1, "quantity": 1, "unit_price": 75000.0, "sub_total": 75000.0},
                {"product_id": 4, "quantity": 1, "unit_price": 120000.0, "sub_total": 120000.0}
            ]
        },
        {
            "user_created": user_id,
            "total": 133000.0,  # 65000 + 68000
            "status": "check",
            "created_at": datetime(2024, 1, 14, 9, 15, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 14, 9, 15, 0, tzinfo=timezone.utc),
            "items": [
                {"product_id": 2, "quantity": 1, "unit_price": 65000.0, "sub_total": 65000.0},
                {"product_id": 3, "quantity": 1, "unit_price": 68000.0, "sub_total": 68000.0}
            ]
        },
        {
            "user_created": user_id,
            "total": 505000.0,  # 160000 + 270000 + 75000
            "status": "completed",
            "created_at": datetime(2024, 1, 10, 14, 20, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 10, 14, 20, 0, tzinfo=timezone.utc),
            "items": [
                {"product_id": 5, "quantity": 1, "unit_price": 160000.0, "sub_total": 160000.0},
                {"product_id": 6, "quantity": 2, "unit_price": 135000.0, "sub_total": 270000.0},
                {"product_id": 1, "quantity": 1, "unit_price": 75000.0, "sub_total": 75000.0}
            ]
        },
        {
            "user_created": user_id,  
            "total": 135000.0,
            "status": "draft",
            "created_at": datetime(2024, 1, 8, 16, 45, 0, tzinfo=timezone.utc),
            "updated_at": datetime(2024, 1, 8, 16, 45, 0, tzinfo=timezone.utc),
            "items": [
                {"product_id": 6, "quantity": 1, "unit_price": 135000.0, "sub_total": 135000.0}
            ]
        }
    ]
    
    # Add orders to database
    for order_data in sample_orders:
        items_data = order_data.pop("items")
        
        # Check if order already exists by checking a combination of user and created_at
        existing_order = session.exec(
            select(Order).where(
                (Order.user_created == order_data["user_created"]) & 
                (Order.created_at == order_data["created_at"])
            )
        ).first()
        
        if not existing_order:
            # Create the order
            order = Order(**order_data)
            session.add(order)
            session.commit()
            session.refresh(order)
            
            # Add order items
            for item_data in items_data:
                order_item = OrderItem(
                    order_id=order.order_id,
                    product_id=item_data["product_id"],
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    sub_total=item_data["sub_total"],
                    created_at=order.created_at,
                    updated_at=order.updated_at
                )
                session.add(order_item)
    
    session.commit()
    
    print("Database seeded successfully!")