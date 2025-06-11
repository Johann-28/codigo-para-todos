"""
Authentication service
Business logic for user authentication, registration, and profile management
"""

import base64
import json
from datetime import datetime, timedelta
from typing import Optional
from app.models.auth import User, UserCreate, UserLogin, UserUpdate, PasswordChange, AuthResponse, TokenData
from app.utils.mock_data import mock_data
from app.core.config import settings

class AuthService:
    """Service class for authentication operations"""
    
    def __init__(self):
        self.mock_data = mock_data
    
    async def login(self, login_data: UserLogin) -> AuthResponse:
        """
        Authenticate user with email and password
        In production, this would verify against a real database with hashed passwords
        """
        # Find user by email
        user = self.mock_data.get_user_by_email(login_data.email)
        
        if not user:
            return AuthResponse(
                success=False,
                message="Usuario no encontrado"
            )
        
        # Mock password validation (in production, verify hashed password)
        if len(login_data.password) < 6:
            return AuthResponse(
                success=False,
                message="Contraseña incorrecta"
            )
        
        # Update last login time
        user.last_login_at = datetime.now()
        
        # Generate mock token
        token = self._generate_token(user)
        
        return AuthResponse(
            success=True,
            message="Inicio de sesión exitoso",
            user=user,
            token=token
        )
    
    async def register(self, user_data: UserCreate) -> AuthResponse:
        """
        Register a new user
        In production, this would hash the password and save to database
        """
        # Check if email already exists
        existing_user = self.mock_data.get_user_by_email(user_data.email)
        if existing_user:
            return AuthResponse(
                success=False,
                message="Este email ya está registrado"
            )
        
        # Create new user
        new_user = User(
            id=str(len(self.mock_data.users) + 1),
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
            avatar=self._generate_random_avatar(),
            role="student",
            enrolled_courses=[],
            completed_courses=[],
            created_at=datetime.now(),
            last_login_at=datetime.now()
        )
        
        # Add to mock database
        self.mock_data._users.append(new_user)
        
        # Generate token
        token = self._generate_token(new_user)
        
        return AuthResponse(
            success=True,
            message="Cuenta creada exitosamente",
            user=new_user,
            token=token
        )
    
    async def social_login(self, provider: str) -> AuthResponse:
        """
        Handle social login (Google, GitHub, Facebook)
        In production, this would verify the social token
        """
        # Create mock social user
        mock_social_user = User(
            id=f"social_{datetime.now().timestamp()}",
            first_name="Usuario",
            last_name=provider.capitalize(),
            email=f"usuario.{provider}@email.com",
            avatar=self._get_social_avatar(provider),
            role="student",
            enrolled_courses=[],
            completed_courses=[],
            created_at=datetime.now(),
            last_login_at=datetime.now()
        )
        
        # Add to mock database
        self.mock_data._users.append(mock_social_user)
        
        # Generate token
        token = self._generate_token(mock_social_user)
        
        return AuthResponse(
            success=True,
            message=f"Conectado con {provider}",
            user=mock_social_user,
            token=token
        )
    
    async def forgot_password(self, email: str) -> AuthResponse:
        """
        Handle forgot password request
        In production, this would send a real email with reset link
        """
        user = self.mock_data.get_user_by_email(email)
        
        if not user:
            return AuthResponse(
                success=False,
                message="Email no encontrado"
            )
        
        # In production: generate reset token and send email
        print(f"Mock: Email de recuperación enviado a: {email}")
        
        return AuthResponse(
            success=True,
            message="Email de recuperación enviado"
        )
    
    async def update_profile(self, user_id: str, update_data: UserUpdate) -> AuthResponse:
        """
        Update user profile information
        In production, this would update the database
        """
        user = self.mock_data.get_user_by_id(user_id)
        
        if not user:
            return AuthResponse(
                success=False,
                message="Usuario no encontrado"
            )
        
        # Update user data
        if update_data.first_name:
            user.first_name = update_data.first_name
        if update_data.last_name:
            user.last_name = update_data.last_name
        if update_data.avatar:
            user.avatar = update_data.avatar
        if update_data.preferences:
            user.preferences = update_data.preferences
        
        return AuthResponse(
            success=True,
            message="Perfil actualizado exitosamente",
            user=user
        )
    
    async def change_password(self, user_id: str, password_data: PasswordChange) -> AuthResponse:
        """
        Change user password
        In production, this would verify current password hash and update with new hash
        """
        user = self.mock_data.get_user_by_id(user_id)
        
        if not user:
            return AuthResponse(
                success=False,
                message="Usuario no encontrado"
            )
        
        # Mock current password validation
        if len(password_data.current_password) < 6:
            return AuthResponse(
                success=False,
                message="Contraseña actual incorrecta"
            )
        
        if len(password_data.new_password) < 8:
            return AuthResponse(
                success=False,
                message="La nueva contraseña debe tener al menos 8 caracteres"
            )
        
        # In production: hash new password and update database
        
        return AuthResponse(
            success=True,
            message="Contraseña actualizada exitosamente"
        )
    
    def _generate_token(self, user: User) -> str:
        """
        Generate a mock JWT token
        In production, use a proper JWT library with secret key
        """
        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "exp": int((datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp())
        }
        
        # Mock JWT - in production use proper JWT encoding
        return "mock_jwt_" + base64.b64encode(json.dumps(payload).encode()).decode()
    
    def _generate_random_avatar(self) -> str:
        """Generate a random avatar emoji"""
        avatars = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "🤓", "😊", "🚀", "💡"]
        import random
        return random.choice(avatars)
    
    def _get_social_avatar(self, provider: str) -> str:
        """Get avatar based on social provider"""
        avatars = {
            "google": "🔍",
            "github": "🐙",
            "facebook": "📘"
        }
        return avatars.get(provider, "👤")

# Global service instance
auth_service = AuthService()