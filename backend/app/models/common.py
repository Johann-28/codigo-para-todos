"""
Common Pydantic models used across the application
Base models and shared data structures
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class DifficultyLevel(str, Enum):
    """Enumeration for difficulty levels"""
    BASIC = "basic"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class LessonType(str, Enum):
    """Enumeration for lesson types"""
    VIDEO = "video"
    READING = "reading"
    EXERCISE = "exercise"
    QUIZ = "quiz"
    PROJECT = "project"

class UserRole(str, Enum):
    """User role enumeration"""
    STUDENT = "student"
    INSTRUCTOR = "instructor"
    ADMIN = "admin"

class Theme(str, Enum):
    """UI theme options"""
    LIGHT = "light"
    DARK = "dark"

class Language(str, Enum):
    """Supported languages"""
    ES = "es"
    EN = "en"

class BaseResponse(BaseModel):
    """Base response model with success status and message"""
    success: bool = True
    message: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)

class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error_code: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

class UserPreferences(BaseModel):
    """User preferences model"""
    theme: Theme = Theme.LIGHT
    language: Language = Language.ES
    notifications: bool = True

class UserStats(BaseModel):
    """User statistics model"""
    total_points: int = Field(0, ge=0, description="Total points earned by user")
    completed_paths: int = Field(0, ge=0, description="Number of completed learning paths")
    current_streak: int = Field(0, ge=0, description="Current daily learning streak")
    total_achievements: int = Field(0, ge=0, description="Total number of achievements")
    weekly_goal: int = Field(0, ge=0, description="Weekly learning goal in hours")
    weekly_progress: float = Field(0.0, ge=0.0, description="Weekly progress in hours")

class PaginationParams(BaseModel):
    """Pagination parameters"""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(10, ge=1, le=100, description="Items per page")
    
class PaginatedResponse(BaseModel):
    """Paginated response wrapper"""
    items: List[Any]
    total: int
    page: int
    limit: int
    pages: int