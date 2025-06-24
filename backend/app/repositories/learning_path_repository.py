"""
Learning path repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class LearningPathRepository(BaseRepository):
    """Repository for learning path operations"""
    
    def __init__(self):
        super().__init__("learning_paths")
    
    def get_collection_name(self) -> str:
        return "learning_paths"
    
    def find_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Find learning paths by difficulty"""
        paths = self.find_all()
        return [path for path in paths if path.get('difficulty') == difficulty]
    
    def find_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Find learning paths by category"""
        paths = self.find_all()
        return [path for path in paths if path.get('category') == category]
    
    def find_popular(self) -> List[Dict[str, Any]]:
        """Find popular learning paths"""
        paths = self.find_all()
        return [path for path in paths if path.get('is_popular', False)]
    
    def update_progress(self, path_id: str, progress: int) -> bool:
        """Update path progress"""
        return self.update(path_id, {"progress": progress}) is not None

# Global instance
learning_path_repository = LearningPathRepository()