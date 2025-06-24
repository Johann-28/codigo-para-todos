"""
Daily tip repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class DailyTipRepository(BaseRepository):
    """Repository for daily tip operations"""
    
    def __init__(self):
        super().__init__("daily_tips")
    
    def get_collection_name(self) -> str:
        return "daily_tips"
    
    def find_by_category(self, category: str) -> List[Dict[str, Any]]:
        """Find tips by category"""
        tips = self.find_all()
        return [tip for tip in tips if tip.get('category') == category]
    
    def get_random_tip(self) -> Optional[Dict[str, Any]]:
        """Get a random tip"""
        import random
        tips = self.find_all()
        return random.choice(tips) if tips else None

# Global instance
daily_tip_repository = DailyTipRepository()