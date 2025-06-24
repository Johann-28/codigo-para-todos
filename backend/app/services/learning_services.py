"""
Learning service using repositories
"""
from typing import List, Optional, Dict, Any  
import random
from app.models.learning import (
    LearningPath, CourseModule, Lesson, Achievement, 
    DailyTip, CourseProgress, Instructor, CourseRating
)
from app.models.diagnostic import EvaluationResult
from app.models.common import DifficultyLevel, LessonType, UserStats
from app.repositories.learning_path_repository import learning_path_repository
from app.repositories.course_module_repository import course_module_repository
from app.repositories.lesson_repository import lesson_repository
from app.repositories.achievement_repository import achievement_repository
from app.repositories.daily_tip_repository import daily_tip_repository
from app.repositories.user_repository import user_repository

class LearningService:
    """Service class for learning-related operations using repositories"""
    
    def __init__(self):
        self.learning_path_repo = learning_path_repository
        self.course_module_repo = course_module_repository
        self.lesson_repo = lesson_repository
        self.achievement_repo = achievement_repository
        self.daily_tip_repo = daily_tip_repository
        self.user_repo = user_repository
    
    async def get_learning_paths(self) -> List[LearningPath]:
        """Get all available learning paths"""
        paths_data = self.learning_path_repo.find_all()
        return [self._dict_to_learning_path(path_data) for path_data in paths_data]
    
    async def get_learning_paths_by_difficulty(self, difficulty: DifficultyLevel) -> List[LearningPath]:
        """Get learning paths filtered by difficulty level"""
        paths_data = self.learning_path_repo.find_by_difficulty(difficulty.value)
        return [self._dict_to_learning_path(path_data) for path_data in paths_data]
    
    async def get_recommended_paths(self, user_id: str, evaluation_result: Optional[EvaluationResult] = None) -> List[LearningPath]:
        """Get recommended learning paths based on user's evaluation result"""
        all_paths = await self.get_learning_paths()
        
        if not evaluation_result:
            # Return popular paths if no evaluation result
            return [path for path in all_paths if path.is_popular]
        
        # Filter by user's level
        recommended_paths = []
        user_level = evaluation_result.level
        
        for path in all_paths:
            # Recommend paths matching user's level or one level up
            if path.difficulty == user_level:
                recommended_paths.append(path)
            elif (user_level == DifficultyLevel.BASIC and path.difficulty == DifficultyLevel.INTERMEDIATE) or \
                 (user_level == DifficultyLevel.INTERMEDIATE and path.difficulty == DifficultyLevel.ADVANCED):
                recommended_paths.append(path)
        
        # Sort by popularity and rating
        recommended_paths.sort(key=lambda x: (x.is_popular, x.rating.average), reverse=True)
        
        return recommended_paths[:6]  # Return top 6 recommendations
    
    async def enroll_in_path(self, user_id: str, path_id: str) -> bool:
        """Enroll user in a learning path"""
        # Get user data
        user_data = self.user_repo.find_by_id(user_id)
        if not user_data:
            raise ValueError("Usuario no encontrado")
        
        # Check if path exists
        path_data = self.learning_path_repo.find_by_id(path_id)
        if not path_data:
            raise ValueError("Ruta de aprendizaje no encontrada")
        
        # Check if already enrolled
        enrolled_courses = user_data.get('enrolled_courses', [])
        if path_id in enrolled_courses:
            return False  # Already enrolled
        
        # Add to enrolled courses
        enrolled_courses.append(path_id)
        self.user_repo.update(user_id, {"enrolled_courses": enrolled_courses})
        
        return True
    
    async def update_path_progress(self, user_id: str, path_id: str, progress: int) -> bool:
        """Update user's progress in a learning path"""
        # Validate progress
        if not 0 <= progress <= 100:
            raise ValueError("El progreso debe estar entre 0 y 100")
        
        # Update progress in learning path (this is a simplification)
        # In a real implementation, you'd have a user_progress table
        path_data = self.learning_path_repo.find_by_id(path_id)
        if not path_data:
            raise ValueError("Ruta de aprendizaje no encontrada")
        
        # For now, we'll just update the progress in the path data
        # In a real DB, this would be in a separate user_progress table
        return self.learning_path_repo.update(path_id, {"progress": progress}) is not None
    
    async def get_course_content(self, path_id: str) -> List[CourseModule]:
        """Get detailed course content for a specific learning path"""
        modules_data = self.course_module_repo.find_by_course_id(path_id)
        modules = []
        
        for module_data in modules_data:
            lessons_data = self.lesson_repo.find_by_module_id(module_data['id'])
            lessons = [self._dict_to_lesson(lesson_data) for lesson_data in lessons_data]
            
            module = self._dict_to_course_module(module_data)
            module.lessons = lessons
            modules.append(module)
        
        return sorted(modules, key=lambda x: x.order)
    
    async def get_lesson_content(self, lesson_id: str) -> Optional[Lesson]:
        """Get specific lesson content"""
        lesson_data = self.lesson_repo.find_by_id(lesson_id)
        if not lesson_data:
            return None
        
        return self._dict_to_lesson(lesson_data)
    
    async def get_course_progress(self, user_id: str, path_id: str) -> CourseProgress:
        """Get course progress summary for a user"""
        modules = await self.get_course_content(path_id)
        
        if not modules:
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
        
        for module in modules:
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
    
    async def get_recent_achievements(self, user_id: str, limit: int = 5) -> List[Achievement]:
        """Get user's recent achievements"""
        achievements_data = self.achievement_repo.find_all()
        achievements = [self._dict_to_achievement(ach_data) for ach_data in achievements_data]
        return achievements[:limit]
    
    async def get_daily_tip(self) -> DailyTip:
        """Get daily tip for the user"""
        tip_data = self.daily_tip_repo.get_random_tip()
        return self._dict_to_daily_tip(tip_data) if tip_data else self._get_default_tip()
    
    async def complete_lesson(self, user_id: str, lesson_id: str) -> None:
        """Mark a lesson as completed for a user"""
        self.lesson_repo.mark_completed(lesson_id)
        
        # Optionally, you can also unlock the next lesson here
        # This would require more complex logic to determine the next lesson
    
    def _dict_to_learning_path(self, data: dict) -> LearningPath:
        """Convert dictionary to LearningPath model"""
        instructor_data = data.get('instructor', {})
        rating_data = data.get('rating', {})
        
        return LearningPath(
            id=data['id'],
            title=data['title'],
            description=data['description'],
            difficulty=DifficultyLevel(data['difficulty']),
            estimated_time=data['estimated_time'],
            modules=data['modules'],
            icon=data['icon'],
            color=data['color'],
            progress=data.get('progress', 0),
            instructor=Instructor(
                name=instructor_data.get('name', ''),
                avatar=instructor_data.get('avatar', ''),
                rating=instructor_data.get('rating', 0)
            ),
            rating=CourseRating(
                average=rating_data.get('average', 0),
                total_reviews=rating_data.get('total_reviews', 0)
            ),
            is_popular=data.get('is_popular', False),
            category=data.get('category', '')
        )
    
    def _dict_to_course_module(self, data: dict) -> CourseModule:
        """Convert dictionary to CourseModule model"""
        return CourseModule(
            id=data['id'],
            title=data['title'],
            description=data['description'],
            estimated_time=data['estimated_time'],
            order=data['order'],
            is_completed=data.get('is_completed', False),
            lessons=[]  # Will be populated separately
        )
    
    def _dict_to_lesson(self, data: dict) -> Lesson:
        """Convert dictionary to Lesson model"""
        return Lesson(
            id=data['id'],
            title=data['title'],
            description=data['description'],
            type=LessonType(data['type']),
            estimated_time=data['estimated_time'],
            order=data['order'],
            is_completed=data.get('is_completed', False),
            is_locked=data.get('is_locked', False)
        )
    
    def _dict_to_achievement(self, data: dict) -> Achievement:
        """Convert dictionary to Achievement model"""
        from datetime import datetime
        return Achievement(
            id=data['id'],
            title=data['title'],
            description=data['description'],
            icon=data['icon'],
            points=data['points'],
            unlocked_at=datetime.now()  # Mock timestamp
        )
    
    def _dict_to_daily_tip(self, data: dict) -> DailyTip:
        """Convert dictionary to DailyTip model"""
        from datetime import datetime
        return DailyTip(
            id=data['id'],
            title=data['title'],
            content=data['content'],
            category=data['category'],
            icon=data['icon'],
            date=datetime.now()
        )
    
    def _get_default_tip(self) -> DailyTip:
        """Get default tip when no tips are available"""
        from datetime import datetime
        return DailyTip(
            id="default",
            title="¡Sigue aprendiendo!",
            content="La práctica hace al maestro. Dedica un poco de tiempo cada día a mejorar tus habilidades.",
            category="motivation",
            icon="💪",
            date=datetime.now()
        )
    
    async def get_all_achievements(self, user_id: str) -> List[Achievement]:
        """Get all achievements for a user"""
        # In a real implementation, this would filter by user_id
        # For now, return all available achievements
        achievements_data = self.achievement_repo.find_all()
        achievements = [self._dict_to_achievement(ach_data) for ach_data in achievements_data]
        return achievements
    
    async def get_user_stats(self, user_id: str) -> UserStats:
        """Get user statistics for dashboard"""
        # Get user data
        user_data = self.user_repo.find_by_id(user_id)
        if not user_data:
            raise ValueError("Usuario no encontrado")
        
        # Calculate statistics
        enrolled_courses = user_data.get('enrolled_courses', [])
        completed_courses = user_data.get('completed_courses', [])
        
        # Mock statistics calculation
        total_points = random.randint(100, 2000)
        completed_paths = len(completed_courses)
        current_streak = random.randint(0, 25)
        
        # Get total achievements available
        all_achievements = await self.get_all_achievements(user_id)
        total_achievements = len(all_achievements)
        
        # Mock weekly progress
        weekly_goal = 10
        weekly_progress = random.uniform(2.0, 12.0)
        
        return UserStats(
            total_points=total_points,
            completed_paths=completed_paths,
            current_streak=current_streak,
            total_achievements=total_achievements,
            weekly_goal=weekly_goal,
            weekly_progress=weekly_progress
        )
    
    async def get_user_path_progress(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's progress across all enrolled learning paths"""
        # Get user data
        user_data = self.user_repo.find_by_id(user_id)
        if not user_data:
            raise ValueError("Usuario no encontrado")
        
        enrolled_courses = user_data.get('enrolled_courses', [])
        progress_list = []
        
        for course_id in enrolled_courses:
            # Get learning path data
            path_data = self.learning_path_repo.find_by_id(course_id)
            if not path_data:
                continue
                
            # Get course progress
            course_progress = await self.get_course_progress(user_id, course_id)
            
            # Create progress summary
            progress_info = {
                "path_id": course_id,
                "path_title": path_data['title'],
                "path_icon": path_data['icon'],
                "path_color": path_data['color'],
                "difficulty": path_data['difficulty'],
                "total_lessons": course_progress.total_lessons,
                "completed_lessons": course_progress.completed_lessons,
                "progress_percentage": course_progress.progress_percentage,
                "current_module": course_progress.current_module,
                "next_lesson": {
                    "id": course_progress.next_lesson.id if course_progress.next_lesson else None,
                    "title": course_progress.next_lesson.title if course_progress.next_lesson else None,
                    "type": course_progress.next_lesson.type.value if course_progress.next_lesson else None
                } if course_progress.next_lesson else None,
                "estimated_time": path_data['estimated_time']
            }
            
            progress_list.append(progress_info)
        
        return progress_list

# Global service instance
learning_service = LearningService()