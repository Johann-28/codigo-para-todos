"""
Authentication router
Endpoints for user authentication, registration, and profile management
"""

import asyncio
from fastapi import APIRouter, HTTPException, status
from app.models.auth import (
    UserLogin, UserCreate, UserUpdate, PasswordChange, 
    ForgotPassword, SocialLoginProvider, AuthResponse
)
from app.services.auth_service import auth_service
from app.core.config import settings

router = APIRouter()

@router.post("/login", response_model=AuthResponse)
async def login(login_data: UserLogin):
    """
    Authenticate user with email and password
    
    - **email**: User's email address
    - **password**: User's password (minimum 6 characters for demo)
    - **remember_me**: Whether to create a persistent session
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(settings.MOCK_DELAY_SECONDS)
    
    try:
        result = await auth_service.login(login_data)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/register", response_model=AuthResponse)
async def register(user_data: UserCreate):
    """
    Register a new user account
    
    - **first_name**: User's first name
    - **last_name**: User's last name  
    - **email**: Valid email address
    - **password**: Password (minimum 6 characters)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(settings.MOCK_DELAY_SECONDS + 0.5)  # Registration takes longer
    
    try:
        result = await auth_service.register(user_data)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )

@router.post("/social-login", response_model=AuthResponse)
async def social_login(provider_data: SocialLoginProvider):
    """
    Authenticate user with social login (Google, GitHub, Facebook)
    
    - **provider**: Social login provider (google, github, facebook)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(1.0)
    
    try:
        result = await auth_service.social_login(provider_data.provider)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al conectar con {provider_data.provider}"
        )

@router.post("/forgot-password", response_model=AuthResponse)
async def forgot_password(forgot_data: ForgotPassword):
    """
    Send password reset email to user
    
    - **email**: User's email address
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(1.0)
    
    try:
        result = await auth_service.forgot_password(forgot_data.email)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar email de recuperación"
        )

@router.put("/profile/{user_id}", response_model=AuthResponse)
async def update_profile(user_id: str, update_data: UserUpdate):
    """
    Update user profile information
    
    - **user_id**: User's unique identifier
    - **update_data**: Fields to update (first_name, last_name, avatar, preferences)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.8)
    
    try:
        result = await auth_service.update_profile(user_id, update_data)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar perfil"
        )

@router.put("/change-password/{user_id}", response_model=AuthResponse)
async def change_password(user_id: str, password_data: PasswordChange):
    """
    Change user password
    
    - **user_id**: User's unique identifier
    - **current_password**: Current password for verification
    - **new_password**: New password (minimum 8 characters)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(1.0)
    
    try:
        result = await auth_service.change_password(user_id, password_data)
        if not result.success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.message
            )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al cambiar contraseña"
        )

@router.post("/logout")
async def logout():
    """
    Logout user (invalidate session)
    In production, this would invalidate the JWT token
    """
    return {"success": True, "message": "Sesión cerrada exitosamente"}