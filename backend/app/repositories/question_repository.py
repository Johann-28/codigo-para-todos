"""
Question repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class QuestionRepository(BaseRepository):
    """Repository for question operations"""
    
    def __init__(self):
        super().__init__("questions")
    
    def get_collection_name(self) -> str:
        return "questions"
    
    def find_by_difficulty(self, difficulty: str) -> List[Dict[str, Any]]:
        """Find questions by difficulty"""
        questions = self.find_all()
        return [q for q in questions if q.get('difficulty') == difficulty]
    
    def find_by_topic(self, topic: str) -> List[Dict[str, Any]]:
        """Find questions by topic"""
        questions = self.find_all()
        return [q for q in questions if q.get('topic') == topic]
    
    def find_adaptive(self, difficulty_levels: List[str], exclude_ids: List[int] = None) -> List[Dict[str, Any]]:
        """Find questions for adaptive testing"""
        questions = self.find_all()
        exclude_ids = exclude_ids or []
        
        filtered = [
            q for q in questions 
            if q.get('difficulty') in difficulty_levels 
            and q.get('id') not in exclude_ids
        ]
        return filtered

# Global instance
question_repository = QuestionRepository()