"""
Learning-related Pydantic models
Models for learning paths, courses, lessons, and progress tracking
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.common import DifficultyLevel, LessonType, BaseResponse

class LessonContent(BaseModel):
    """Lesson content model"""
    video_url: Optional[str] = Field(None, description="URL for video content")
    text_content: Optional[str] = Field(None, description="Text/reading content")
    exercise_data: Optional[Dict[str, Any]] = Field(None, description="Exercise configuration")
    quiz_data: Optional[Dict[str, Any]] = Field(None, description="Quiz configuration")

class Lesson(BaseModel):
    """Lesson model"""
    id: str = Field(..., description="Unique lesson identifier")
    title: str = Field(..., min_length=1, description="Lesson title")
    description: str = Field(..., description="Lesson description")
    type: LessonType = Field(..., description="Type of lesson")
    estimated_time: str = Field(..., description="Estimated completion time")
    is_completed: bool = Field(False, description="Whether lesson is completed")
    is_locked: bool = Field(False, description="Whether lesson is locked")
    order: int = Field(..., ge=1, description="Lesson order in module")
    content: Optional[LessonContent] = Field(None, description="Lesson content")

class CourseModule(BaseModel):
    """Course module model"""
    id: str = Field(..., description="Unique module identifier")
    title: str = Field(..., min_length=1, description="Module title")
    description: str = Field(..., description="Module description")
    estimated_time: str = Field(..., description="Estimated completion time")
    is_completed: bool = Field(False, description="Whether module is completed")
    lessons: List[Lesson] = Field(..., description="List of lessons in module")
    order: int = Field(..., ge=1, description="Module order in course")

class Instructor(BaseModel):
    """Instructor information model"""
    name: str = Field(..., description="Instructor name")
    avatar: str = Field(..., description="Instructor avatar")
    rating: float = Field(..., ge=0.0, le=5.0, description="Instructor rating")

class CourseRating(BaseModel):
    """Course rating model"""
    average: float = Field(..., ge=0.0, le=5.0, description="Average rating")
    total_reviews: int = Field(..., ge=0, description="Total number of reviews")

class LearningPath(BaseModel):
    """Learning path/course model"""
    id: str = Field(..., description="Unique learning path identifier")
    title: str = Field(..., min_length=1, description="Course title")
    description: str = Field(..., description="Course description")
    difficulty: DifficultyLevel = Field(..., description="Course difficulty level")
    estimated_time: str = Field(..., description="Estimated completion time")
    modules: int = Field(..., ge=1, description="Number of modules")
    icon: str = Field(..., description="Course icon")
    color: str = Field(..., description="Course theme color")
    progress: int = Field(0, ge=0, le=100, description="User progress percentage")
    enrolled: bool = Field(False, description="Whether user is enrolled")
    last_accessed: Optional[datetime] = Field(None, description="Last access timestamp")
    completed_modules: int = Field(0, ge=0, description="Number of completed modules")
    prerequisites: List[str] = Field(default_factory=list, description="Required prerequisites")
    skills: List[str] = Field(default_factory=list, description="Skills learned")
    instructor: Optional[Instructor] = Field(None, description="Course instructor")
    rating: Optional[CourseRating] = Field(None, description="Course rating")
    is_new: bool = Field(False, description="Whether course is new")
    is_popular: bool = Field(False, description="Whether course is popular")
    category: Optional[str] = Field(None, description="Course category")
    content: List[CourseModule] = Field(default_factory=list, description="Course modules")

class Achievement(BaseModel):
    """Achievement model"""
    id: str = Field(..., description="Unique achievement identifier")
    title: str = Field(..., description="Achievement title")
    description: str = Field(..., description="Achievement description")
    icon: str = Field(..., description="Achievement icon")
    unlocked_at: datetime = Field(..., description="When achievement was unlocked")
    points: int = Field(..., ge=0, description="Points awarded for achievement")

class DailyTip(BaseModel):
    """Daily tip model"""
    id: str = Field(..., description="Unique tip identifier")
    title: str = Field(..., description="Tip title")
    content: str = Field(..., description="Tip content")
    category: str = Field(..., description="Tip category")
    icon: str = Field(..., description="Tip icon")
    date: datetime = Field(..., description="Tip date")

class CourseProgress(BaseModel):
    """Course progress summary"""
    total_lessons: int = Field(..., ge=0, description="Total lessons in course")
    completed_lessons: int = Field(..., ge=0, description="Completed lessons")
    progress_percentage: int = Field(..., ge=0, le=100, description="Progress percentage")
    current_module: str = Field(..., description="Current module title")
    next_lesson: Optional[Lesson] = Field(None, description="Next lesson to complete")

class EnrollmentRequest(BaseModel):
    """Course enrollment request"""
    user_id: str = Field(..., description="User ID")
    path_id: str = Field(..., description="Learning path ID")

class ProgressUpdateRequest(BaseModel):
    """Progress update request"""
    user_id: str = Field(..., description="User ID")
    path_id: str = Field(..., description="Learning path ID")
    progress: int = Field(..., ge=0, le=100, description="Progress percentage")

class LessonCompletionRequest(BaseModel):
    """Lesson completion request"""
    user_id: str = Field(..., description="User ID")
    lesson_id: str = Field(..., description="Lesson ID")