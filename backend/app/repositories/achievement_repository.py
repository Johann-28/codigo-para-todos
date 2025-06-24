"""
Achievement repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class AchievementRepository(BaseRepository):
    """Repository for achievement operations"""
    
    def __init__(self):
        super().__init__("achievements")
    
    def get_collection_name(self) -> str:
        return "achievements"
    
    def find_by_points_range(self, min_points: int, max_points: int) -> List[Dict[str, Any]]:
        """Find achievements by points range"""
        achievements = self.find_all()
        return [
            achievement for achievement in achievements 
            if min_points <= achievement.get('points', 0) <= max_points
        ]

# Global instance
achievement_repository = AchievementRepository()