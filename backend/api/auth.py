# Authentication API endpoints
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlmodel import Session
from datetime import timedelta
from typing import Optional

from db.database import get_session
from repositories.user_repository import UserRepository
from services.auth_service import verify_password, create_access_token, verify_token
from schemas.auth import (
    UserRegisterRequest, 
    UserLoginRequest, 
    TokenResponse, 
    UserResponse,
    MessageResponse
)
from core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegisterRequest,
    session: Session = Depends(get_session)
):
    """Registrar un nuevo usuario"""
    user_repo = UserRepository(session)
    
    # Validar que el username no existe
    if user_repo.username_exists(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de usuario ya existe"
        )
    
    # Validar que el email no existe  
    if user_repo.email_exists(user_data.email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear el usuario
    try:
        user = user_repo.create_user(
            username=user_data.username,
            email=user_data.email,
            name=user_data.name,
            last_name=user_data.last_name,
            password=user_data.password
        )
        return MessageResponse(message="Usuario registrado exitosamente")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al crear el usuario"
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: UserLoginRequest,
    session: Session = Depends(get_session)
):
    """Iniciar sesión y obtener token JWT"""
    user_repo = UserRepository(session)
    
    # Buscar usuario
    user = user_repo.get_user_by_username(login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verificar contraseña
    if not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales incorrectas",
            headers={"WWW-Authenticate": "Bearer"}
        )
    
    # Verificar que el usuario esté activo
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo"
        )
    
    # Crear token de acceso
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={
            "sub": user.username,
            "user_id": user.user_id,
            "role": user.role.value
        },
        expires_delta=access_token_expires
    )
    
    # Preparar respuesta del usuario
    user_response = UserResponse(
        user_id=user.user_id,
        username=user.username,
        email=user.email,
        name=user.name,
        last_name=user.last_name,
        role=user.role.value,
        is_active=user.is_active,
        created_at=user.created_at
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )

# Middleware para obtener usuario actual
async def get_current_user(
    authorization: Optional[str] = Header(None),
    session: Session = Depends(get_session)
) -> UserResponse:
    """Obtener usuario actual desde el token JWT"""
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de autorización requerido"
        )
        
    try:
        # Extraer token del header Authorization
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Esquema de autenticación inválido"
            )
        
        # Verificar token y obtener datos
        payload = verify_token(token)
        user_repo = UserRepository(session)
        user = user_repo.get_user_by_username(payload["sub"])
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Usuario no encontrado"
            )
        
        return UserResponse(
            user_id=user.user_id,
            username=user.username,
            email=user.email,
            name=user.name,
            last_name=user.last_name,
            role=user.role.value,
            is_active=user.is_active,
            created_at=user.created_at
        )
    
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token malformado"
        )

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: UserResponse = Depends(get_current_user)):
    """Obtener información del usuario actual"""
    return current_user
