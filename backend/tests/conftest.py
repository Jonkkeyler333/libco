"""
Configuración de pytest para los tests
"""
import pytest
import os
from sqlmodel import Session, create_engine, SQLModel
from fastapi.testclient import TestClient
from unittest.mock import patch

# Importar la aplicación y las dependencias
from main import app
from db.database import get_session
from models.user import User, UserRole
from models.product import Product
from models.inventory import Inventory
from models.category import Category
from models.order import Order
from models.order_item import OrderItem
from services.auth_service import create_access_token, get_password_hash
from datetime import datetime, timezone, timedelta

# URL de base de datos de test
TEST_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="function")
def test_engine():
    """Crear engine de test con SQLite en memoria"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    SQLModel.metadata.create_all(engine)
    yield engine
    # Cleanup
    try:
        os.remove("./test.db")
    except FileNotFoundError:
        pass

@pytest.fixture(scope="function")
def test_session(test_engine):
    """Crear sesión de test"""
    with Session(test_engine) as session:
        yield session

@pytest.fixture(scope="function")
def client(test_session):
    """Cliente de test con base de datos mockeada"""
    def get_test_session():
        yield test_session
    
    app.dependency_overrides[get_session] = get_test_session
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_user(test_session):
    """Crear usuario de test"""
    user = User(
        username="testuser",
        email="test@example.com",
        ID=1001,
        name="Test",
        last_name="User",
        password_hash=get_password_hash("testpassword"),
        role=UserRole.USER,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    test_session.add(user)
    test_session.commit()
    test_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def test_admin(test_session):
    """Crear admin de test"""
    admin = User(
        username="testadmin",
        email="admin@example.com",
        ID=1002,
        name="Test",
        last_name="Admin",
        password_hash=get_password_hash("adminpassword"),
        role=UserRole.ADMIN,
        is_active=True,
        created_at=datetime.now(timezone.utc)
    )
    test_session.add(admin)
    test_session.commit()
    test_session.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def test_products(test_session):
    """Crear productos de test"""
    products = [
        Product(
            product_id=1,
            sku="TEST-001",
            title="Test Book 1",
            author="Test Author",
            isbn="1234567890123",
            format="paperback",
            edition="1st",
            description="Test book description",
            language="es",
            publisher="Test Publisher",
            publication_year=2023,
            price=50000.0,
            pages=200,
            currency="COP",
            weight=0.5,
            dimensions="15x20x2",
            created_at=datetime.now(timezone.utc)
        ),
        Product(
            product_id=2,
            sku="TEST-002", 
            title="Test Book 2",
            author="Test Author 2",
            isbn="1234567890124",
            format="hardcover",
            edition="2nd",
            description="Another test book",
            language="es",
            publisher="Test Publisher",
            publication_year=2023,
            price=75000.0,
            pages=300,
            currency="COP",
            weight=0.8,
            dimensions="16x21x3",
            created_at=datetime.now(timezone.utc)
        )
    ]
    
    for product in products:
        test_session.add(product)
    test_session.commit()
    
    for product in products:
        test_session.refresh(product)
    
    return products

@pytest.fixture(scope="function")
def test_orders(test_session, test_user, test_products):
    """Crear pedidos de test"""
    orders = [
        Order(
            user_created=test_user.user_id,
            total=125000.0,
            status="completed",
            created_at=datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc),
            updated_at=datetime(2024, 1, 15, 10, 30, 0, tzinfo=timezone.utc)
        ),
        Order(
            user_created=test_user.user_id,
            total=75000.0,
            status="pending",
            created_at=datetime(2024, 1, 14, 9, 15, 0, tzinfo=timezone.utc),
            updated_at=datetime(2024, 1, 14, 9, 15, 0, tzinfo=timezone.utc)
        ),
        Order(
            user_created=test_user.user_id,
            total=50000.0,
            status="draft",
            created_at=datetime(2024, 1, 10, 14, 20, 0, tzinfo=timezone.utc),
            updated_at=datetime(2024, 1, 10, 14, 20, 0, tzinfo=timezone.utc)
        )
    ]
    
    for order in orders:
        test_session.add(order)
    test_session.commit()
    
    for order in orders:
        test_session.refresh(order)
    
    # Agregar items a las órdenes
    order_items = [
        OrderItem(
            order_id=orders[0].order_id,
            product_id=test_products[0].product_id,
            quantity=1,
            unit_price=50000.0,
            sub_total=50000.0,
            created_at=orders[0].created_at,
            updated_at=orders[0].updated_at
        ),
        OrderItem(
            order_id=orders[0].order_id,
            product_id=test_products[1].product_id,
            quantity=1,
            unit_price=75000.0,
            sub_total=75000.0,
            created_at=orders[0].created_at,
            updated_at=orders[0].updated_at
        ),
        OrderItem(
            order_id=orders[1].order_id,
            product_id=test_products[1].product_id,
            quantity=1,
            unit_price=75000.0,
            sub_total=75000.0,
            created_at=orders[1].created_at,
            updated_at=orders[1].updated_at
        ),
        OrderItem(
            order_id=orders[2].order_id,
            product_id=test_products[0].product_id,
            quantity=1,
            unit_price=50000.0,
            sub_total=50000.0,
            created_at=orders[2].created_at,
            updated_at=orders[2].updated_at
        )
    ]
    
    for item in order_items:
        test_session.add(item)
    test_session.commit()
    
    return orders

@pytest.fixture(scope="function")
def auth_headers(test_user):
    """Headers de autenticación para tests"""
    token = create_access_token(data={
        "sub": test_user.username,
        "user_id": test_user.user_id,
        "role": test_user.role.value
    })
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def admin_headers(test_admin):
    """Headers de autenticación para admin"""
    token = create_access_token(data={
        "sub": test_admin.username,
        "user_id": test_admin.user_id,
        "role": test_admin.role.value
    })
    return {"Authorization": f"Bearer {token}"}