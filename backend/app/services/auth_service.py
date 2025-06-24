"""
Authentication service using repositories
"""
import base64
import json
from datetime import datetime, timedelta
from typing import Optional
from app.models.auth import User, UserCreate, UserLogin, UserUpdate, PasswordChange, AuthResponse, TokenData, UserPreferences
from app.models.common import UserRole, Theme, Language
from app.repositories.user_repository import user_repository
from app.core.config import settings

class AuthService:
    """Service class for authentication operations using repositories"""
    
    def __init__(self):
        self.user_repo = user_repository
    
    async def login(self, login_data: UserLogin) -> AuthResponse:
        """Authenticate user with email and password"""
        # Find user by email
        user_data = self.user_repo.find_by_email(login_data.email)
        
        if not user_data:
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
        self.user_repo.update_last_login(user_data['id'])
        
        # Convert to User model
        user = self._dict_to_user(user_data)
        
        # Generate mock token
        token = self._generate_token(user)
        
        return AuthResponse(
            success=True,
            message="Inicio de sesión exitoso",
            user=user,
            token=token
        )
    
    async def register(self, user_data: UserCreate) -> AuthResponse:
        """Register a new user"""
        # Check if email already exists
        existing_user = self.user_repo.find_by_email(user_data.email)
        if existing_user:
            return AuthResponse(
                success=False,
                message="Este email ya está registrado"
            )
        
        # Create new user data
        new_user_data = {
            "id": self._generate_user_id(),
            "first_name": user_data.first_name,
            "last_name": user_data.last_name,
            "email": user_data.email,
            "avatar": self._generate_random_avatar(),
            "role": "student",
            "enrolled_courses": [],
            "completed_courses": [],
            "preferences": {
                "theme": "light",
                "language": "es",
                "notifications": True
            },
            "created_at": datetime.now().isoformat(),
            "last_login_at": datetime.now().isoformat()
        }
        
        # Save to repository
        saved_user_data = self.user_repo.create(new_user_data)
        user = self._dict_to_user(saved_user_data)
        
        # Generate token
        token = self._generate_token(user)
        
        return AuthResponse(
            success=True,
            message="Cuenta creada exitosamente",
            user=user,
            token=token
        )
    
    async def update_profile(self, user_id: str, update_data: UserUpdate) -> AuthResponse:
        """Update user profile information"""
        user_data = self.user_repo.find_by_id(user_id)
        
        if not user_data:
            return AuthResponse(
                success=False,
                message="Usuario no encontrado"
            )
        
        # Prepare updates
        updates = {}
        if update_data.first_name:
            updates["first_name"] = update_data.first_name
        if update_data.last_name:
            updates["last_name"] = update_data.last_name
        if update_data.avatar:
            updates["avatar"] = update_data.avatar
        if update_data.preferences:
            updates["preferences"] = update_data.preferences.dict()
        
        # Update in repository
        updated_data = self.user_repo.update(user_id, updates)
        if not updated_data:
            return AuthResponse(
                success=False,
                message="Error al actualizar perfil"
            )
        
        user = self._dict_to_user(updated_data)
        
        return AuthResponse(
            success=True,
            message="Perfil actualizado exitosamente",
            user=user
        )
    
    def _dict_to_user(self, user_data: dict) -> User:
        """Convert dictionary to User model"""
        preferences_data = user_data.get('preferences', {})
        preferences = UserPreferences(
            theme=Theme(preferences_data.get('theme', 'light')),
            language=Language(preferences_data.get('language', 'es')),
            notifications=preferences_data.get('notifications', True)
        )
        
        return User(
            id=user_data['id'],
            first_name=user_data['first_name'],
            last_name=user_data['last_name'],
            email=user_data['email'],
            avatar=user_data.get('avatar', '👤'),
            role=UserRole(user_data.get('role', 'student')),
            enrolled_courses=user_data.get('enrolled_courses', []),
            completed_courses=user_data.get('completed_courses', []),
            preferences=preferences,
            created_at=datetime.fromisoformat(user_data['created_at'].replace('Z', '+00:00')),
            last_login_at=datetime.fromisoformat(user_data['last_login_at'].replace('Z', '+00:00'))
        )
    
    def _generate_user_id(self) -> str:
        """Generate unique user ID"""
        existing_users = self.user_repo.find_all()
        max_id = max([int(user.get('id', '0')) for user in existing_users if user.get('id', '0').isdigit()], default=0)
        return str(max_id + 1)
    
    def _generate_token(self, user: User) -> str:
        """Generate a mock JWT token"""
        payload = {
            "user_id": user.id,
            "email": user.email,
            "role": user.role.value,
            "exp": int((datetime.now() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)).timestamp())
        }
        
        return "mock_jwt_" + base64.b64encode(json.dumps(payload).encode()).decode()
    
    def _generate_random_avatar(self) -> str:
        """Generate a random avatar emoji"""
        avatars = ["👨‍💻", "👩‍💻", "🧑‍💻", "👨‍🎓", "👩‍🎓", "🧑‍🎓", "🤓", "😊", "🚀", "💡"]
        import random
        return random.choice(avatars)

# Global service instance
auth_service = AuthService()