"""
Tests para autenticación (login)
"""
import pytest
from fastapi import status


class TestAuth:
    """Tests para endpoints de autenticación"""

    def test_login_success(self, client, test_user):
        """Test login exitoso con credenciales válidas"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "testuser",
                "password": "testpassword"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testuser"
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["role"] == "user"

    def test_login_invalid_username(self, client, test_user):
        """Test login con username inválido"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "invalid_user",
                "password": "testpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["detail"] == "Credenciales incorrectas"

    def test_login_invalid_password(self, client, test_user):
        """Test login con contraseña inválida"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "testuser",
                "password": "wrong_password"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["detail"] == "Credenciales incorrectas"

    def test_login_inactive_user(self, client, test_session):
        """Test login con usuario inactivo"""
        from models.user import User, UserRole
        from services.auth_service import get_password_hash
        from datetime import datetime, timezone
        
        # Crear usuario inactivo
        inactive_user = User(
            username="inactive_user",
            email="inactive@example.com",
            ID=1003,
            name="Inactive",
            last_name="User",
            password_hash=get_password_hash("password123"),
            role=UserRole.USER,
            is_active=False,
            created_at=datetime.now(timezone.utc)
        )
        test_session.add(inactive_user)
        test_session.commit()
        
        response = client.post(
            "/api/auth/login",
            json={
                "username": "inactive_user",
                "password": "password123"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
        data = response.json()
        assert data["detail"] == "Usuario inactivo"

    def test_login_missing_credentials(self, client):
        """Test login sin proporcionar credenciales"""
        response = client.post("/api/auth/login", json={})
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY

    def test_login_empty_username(self, client):
        """Test login con username vacío"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "",
                "password": "testpassword"
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_empty_password(self, client, test_user):
        """Test login con contraseña vacía"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "testuser",
                "password": ""
            }
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_admin_login_success(self, client, test_admin):
        """Test login exitoso con usuario admin"""
        response = client.post(
            "/api/auth/login",
            json={
                "username": "testadmin",
                "password": "adminpassword"
            }
        )
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["username"] == "testadmin"
        assert data["user"]["role"] == "admin"

    def test_get_current_user_success(self, client, test_user, auth_headers):
        """Test obtener usuario actual con token válido"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"
        assert data["role"] == "user"

    def test_get_current_user_invalid_token(self, client):
        """Test obtener usuario actual con token inválido"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_missing_token(self, client):
        """Test obtener usuario actual sin token"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_get_current_user_malformed_token(self, client):
        """Test obtener usuario actual con token mal formado"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "InvalidBearer token"}
        )
        
        assert response.status_code == status.HTTP_401_UNAUTHORIZED