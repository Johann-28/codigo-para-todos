"""
Lesson repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class LessonRepository(BaseRepository):
    """Repository for lesson operations"""
    
    def __init__(self):
        super().__init__("lessons")
    
    def get_collection_name(self) -> str:
        return "lessons"
    
    def find_by_module_id(self, module_id: str) -> List[Dict[str, Any]]:
        """Find lessons by module ID"""
        lessons = self.find_all()
        return [lesson for lesson in lessons if lesson.get('module_id') == module_id]
    
    def find_by_type(self, lesson_type: str) -> List[Dict[str, Any]]:
        """Find lessons by type"""
        lessons = self.find_all()
        return [lesson for lesson in lessons if lesson.get('type') == lesson_type]
    
    def mark_completed(self, lesson_id: str) -> bool:
        """Mark lesson as completed"""
        return self.update(lesson_id, {"is_completed": True}) is not None
    
    def unlock_lesson(self, lesson_id: str) -> bool:
        """Unlock lesson"""
        return self.update(lesson_id, {"is_locked": False}) is not None

# Global instance
lesson_repository = LessonRepository()