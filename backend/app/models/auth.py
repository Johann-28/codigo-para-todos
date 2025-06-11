"""
Authentication-related Pydantic models
User models, authentication requests/responses, and related data structures
"""

from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from app.models.common import BaseResponse, UserRole, UserPreferences

class User(BaseModel):
    """User model with all user information"""
    id: str = Field(..., description="Unique user identifier")
    first_name: str = Field(..., min_length=1, max_length=50, description="User's first name")
    last_name: str = Field(..., min_length=1, max_length=50, description="User's last name")
    email: EmailStr = Field(..., description="User's email address")
    avatar: Optional[str] = Field(None, description="User's avatar emoji or URL")
    role: UserRole = Field(UserRole.STUDENT, description="User's role in the system")
    enrolled_courses: List[str] = Field(default_factory=list, description="List of enrolled course IDs")
    completed_courses: List[str] = Field(default_factory=list, description="List of completed course IDs")
    preferences: UserPreferences = Field(default_factory=UserPreferences, description="User preferences")
    created_at: datetime = Field(default_factory=datetime.now, description="Account creation timestamp")
    last_login_at: datetime = Field(default_factory=datetime.now, description="Last login timestamp")

class UserCreate(BaseModel):
    """Model for user registration"""
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6, description="Password must be at least 6 characters")

class UserLogin(BaseModel):
    """Model for user login"""
    email: EmailStr
    password: str = Field(..., min_length=1)
    remember_me: bool = False

class UserUpdate(BaseModel):
    """Model for updating user profile"""
    first_name: Optional[str] = Field(None, min_length=1, max_length=50)
    last_name: Optional[str] = Field(None, min_length=1, max_length=50)
    avatar: Optional[str] = None
    preferences: Optional[UserPreferences] = None

class PasswordChange(BaseModel):
    """Model for changing user password"""
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, description="New password must be at least 8 characters")

class ForgotPassword(BaseModel):
    """Model for forgot password request"""
    email: EmailStr

class AuthResponse(BaseResponse):
    """Authentication response model"""
    user: Optional[User] = None
    token: Optional[str] = Field(None, description="JWT authentication token")

class SocialLoginProvider(BaseModel):
    """Social login provider request"""
    provider: str = Field(..., pattern="^(google|github|facebook)$", description="Social login provider")

class TokenData(BaseModel):
    """JWT token payload data"""
    user_id: str
    email: str
    role: str
    exp: int  # Expiration timestamp