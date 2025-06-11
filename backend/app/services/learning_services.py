"""
Learning service
Business logic for learning paths, courses, lessons, and progress tracking
"""

from typing import List, Optional, Dict
import random
from app.models.learning import (
    LearningPath, CourseModule, Lesson, Achievement, DailyTip, 
    CourseProgress, EnrollmentRequest, ProgressUpdateRequest, LessonCompletionRequest
)
from app.models.diagnostic import EvaluationResult
from app.models.common import DifficultyLevel, UserStats
from app.utils.mock_data import mock_data

class LearningService:
    """Service class for learning-related operations"""
    
    def __init__(self):
        self.mock_data = mock_data
    
    async def get_learning_paths(self) -> List[LearningPath]:
        """
        Get all available learning paths
        In production, this would query the database
        """
        return self.mock_data.learning_paths
    
    async def get_learning_paths_by_difficulty(self, difficulty: DifficultyLevel) -> List[LearningPath]:
        """
        Get learning paths filtered by difficulty level
        """
        return [path for path in self.mock_data.learning_paths 
                if path.difficulty == difficulty]
    
    async def get_recommended_paths(self, user_id: str, 
                                  evaluation_result: Optional[EvaluationResult] = None) -> List[LearningPath]:
        """
        Get recommended learning paths based on user's evaluation result
        """
        recommended_paths = list(self.mock_data.learning_paths)
        
        if evaluation_result:
            # Filter by user's level and next level
            user_level = evaluation_result.level
            next_level = self._get_next_difficulty_level(user_level)
            
            recommended_paths = [path for path in self.mock_data.learning_paths 
                               if path.difficulty == user_level or path.difficulty == next_level]
            
            # Sort by difficulty (user's level first) and progress
            recommended_paths.sort(key=lambda x: (
                0 if x.difficulty == user_level else 1,
                -(x.progress or 0)
            ))
        
        return recommended_paths[:3]  # Return top 3 recommendations
    
    async def get_recent_achievements(self, user_id: str, limit: int = 5) -> List[Achievement]:
        """
        Get user's recent achievements
        In production, this would query user-specific achievements
        """
        achievements = list(self.mock_data.achievements)
        achievements.sort(key=lambda x: x.unlocked_at, reverse=True)
        return achievements[:limit]
    
    async def get_all_achievements(self, user_id: str) -> List[Achievement]:
        """
        Get all user achievements
        """
        return self.mock_data.achievements
    
    async def get_user_stats(self, user_id: str) -> UserStats:
        """
        Get user statistics and progress
        """
        return self.mock_data.get_user_stats(user_id)
    
    async def get_daily_tip(self) -> DailyTip:
        """
        Get daily tip for the user
        """
        # Return random tip from available tips
        return random.choice(self.mock_data.daily_tips)
    
    async def update_path_progress(self, user_id: str, path_id: str, progress: int) -> None:
        """
        Update learning path progress for a user
        In production, this would update the database
        """
        # Update mock data
        path = self.mock_data.get_learning_path_by_id(path_id)
        if path:
            path.progress = progress
            print(f"Updated progress for user {user_id}, path {path_id}: {progress}%")
    
    async def enroll_in_path(self, user_id: str, path_id: str) -> None:
        """
        Enroll user in a learning path
        In production, this would create enrollment record in database
        """
        # Update mock data
        path = self.mock_data.get_learning_path_by_id(path_id)
        if path:
            path.enrolled = True
            print(f"User {user_id} enrolled in path {path_id}")
    
    async def get_course_content(self, path_id: str) -> List[CourseModule]:
        """
        Get detailed course content for a specific learning path
        """
        path = self.mock_data.get_learning_path_by_id(path_id)
        return path.content if path else []
    
    async def get_lesson_content(self, lesson_id: str) -> Optional[Lesson]:
        """
        Get specific lesson content
        """
        # Search across all paths and modules
        for path in self.mock_data.learning_paths:
            for module in path.content:
                for lesson in module.lessons:
                    if lesson.id == lesson_id:
                        return lesson
        return None
    
    async def complete_lesson(self, user_id: str, lesson_id: str) -> None:
        """
        Mark a lesson as completed for a user
        In production, this would update the database
        """
        # Find and update lesson in mock data
        for path in self.mock_data.learning_paths:
            for module in path.content:
                for lesson in module.lessons:
                    if lesson.id == lesson_id:
                        lesson.is_completed = True
                        print(f"Lesson {lesson_id} completed by user {user_id}")
                        return
    
    async def get_course_progress(self, user_id: str, path_id: str) -> CourseProgress:
        """
        Get course progress summary for a user
        """
        path = self.mock_data.get_learning_path_by_id(path_id)
        
        if not path or not path.content:
            return CourseProgress(
                total_lessons=0,
                completed_lessons=0,
                progress_percentage=0,
                current_module="",
                next_lesson=None
            )
        
        total_lessons = 0
        completed_lessons = 0
        next_lesson = None
        current_module = ""
        
        for module in path.content:
            for lesson in module.lessons:
                total_lessons += 1
                if lesson.is_completed:
                    completed_lessons += 1
                elif not next_lesson:
                    next_lesson = lesson
                    current_module = module.title
        
        progress_percentage = round((completed_lessons / total_lessons) * 100) if total_lessons > 0 else 0
        
        return CourseProgress(
            total_lessons=total_lessons,
            completed_lessons=completed_lessons,
            progress_percentage=progress_percentage,
            current_module=current_module,
            next_lesson=next_lesson
        )
    
    async def get_user_path_progress(self, user_id: str) -> List[Dict[str, any]]:
        """
        Get user's progress across all enrolled learning paths
        """
        # Mock progress data
        mock_progress = [
            {"path_id": "web-development", "progress": 25},
            {"path_id": "basic-programming", "progress": 100}
        ]
        return mock_progress
    
    def _get_next_difficulty_level(self, current_level: DifficultyLevel) -> DifficultyLevel:
        """Get the next difficulty level"""
        level_progression = {
            DifficultyLevel.BASIC: DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.INTERMEDIATE: DifficultyLevel.ADVANCED,
            DifficultyLevel.ADVANCED: DifficultyLevel.ADVANCED
        }
        return level_progression.get(current_level, DifficultyLevel.BASIC)

# Global service instance
learning_service = LearningService()