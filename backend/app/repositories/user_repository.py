"""
User repository for JSON operations
"""
from typing import List, Optional, Dict, Any
from .base_repository import BaseRepository

class UserRepository(BaseRepository):
    """Repository for user operations"""
    
    def __init__(self):
        super().__init__("users")
    
    def get_collection_name(self) -> str:
        return "users"
    
    def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Find user by email"""
        users = self.find_all()
        return next((user for user in users if user.get('email') == email), None)
    
    def find_by_role(self, role: str) -> List[Dict[str, Any]]:
        """Find users by role"""
        users = self.find_all()
        return [user for user in users if user.get('role') == role]
    
    def update_last_login(self, user_id: str) -> bool:
        """Update user's last login timestamp"""
        from datetime import datetime
        return self.update(user_id, {"last_login_at": datetime.now().isoformat()}) is not None

# Global instance
user_repository = UserRepository()