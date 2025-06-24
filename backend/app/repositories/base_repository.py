"""
Base repository for JSON file operations
"""
import json
import os
from typing import List, Dict, Optional, Any
from pathlib import Path
from abc import ABC, abstractmethod

class BaseRepository(ABC):
    """Base repository class for JSON file operations"""
    
    def __init__(self, filename: str):
        self.filename = filename
        self.data_dir = Path(__file__).parent.parent / "data"
        self.data_dir.mkdir(exist_ok=True)
        self.file_path = self.data_dir / f"{filename}.json"
    
    def _load_data(self) -> Dict[str, Any]:
        """Load data from JSON file"""
        try:
            if self.file_path.exists():
                with open(self.file_path, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return {}
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    
    def _save_data(self, data: Dict[str, Any]) -> bool:
        """Save data to JSON file"""
        try:
            with open(self.file_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False, default=str)
            return True
        except Exception as e:
            print(f"Error saving data to {self.filename}: {e}")
            return False
    
    @abstractmethod
    def get_collection_name(self) -> str:
        """Return the collection name for this repository"""
        pass
    
    def find_all(self) -> List[Dict[str, Any]]:
        """Get all items from collection"""
        data = self._load_data()
        return data.get(self.get_collection_name(), [])
    
    def find_by_id(self, item_id: str) -> Optional[Dict[str, Any]]:
        """Find item by ID"""
        items = self.find_all()
        return next((item for item in items if str(item.get('id')) == str(item_id)), None)
    
    def create(self, item: Dict[str, Any]) -> Dict[str, Any]:
        """Create new item"""
        data = self._load_data()
        collection = data.get(self.get_collection_name(), [])
        collection.append(item)
        data[self.get_collection_name()] = collection
        self._save_data(data)
        return item
    
    def update(self, item_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update item by ID"""
        data = self._load_data()
        collection = data.get(self.get_collection_name(), [])
        
        for i, item in enumerate(collection):
            if str(item.get('id')) == str(item_id):
                collection[i].update(updates)
                data[self.get_collection_name()] = collection
                self._save_data(data)
                return collection[i]
        return None
    
    def delete(self, item_id: str) -> bool:
        """Delete item by ID"""
        data = self._load_data()
        collection = data.get(self.get_collection_name(), [])
        
        for i, item in enumerate(collection):
            if str(item.get('id')) == str(item_id):
                del collection[i]
                data[self.get_collection_name()] = collection
                self._save_data(data)
                return True
        return False