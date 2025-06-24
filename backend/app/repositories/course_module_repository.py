"""
Course module repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class CourseModuleRepository(BaseRepository):
    """Repository for course module operations"""
    
    def __init__(self):
        super().__init__("course_modules")
    
    def get_collection_name(self) -> str:
        return "course_modules"
    
    def find_by_course_id(self, course_id: str) -> List[Dict[str, Any]]:
        """Find modules by course ID"""
        modules = self.find_all()
        return [module for module in modules if module.get('course_id') == course_id]
    
    def find_completed_by_course(self, course_id: str) -> List[Dict[str, Any]]:
        """Find completed modules by course ID"""
        modules = self.find_by_course_id(course_id)
        return [module for module in modules if module.get('is_completed', False)]

# Global instance
course_module_repository = CourseModuleRepository()