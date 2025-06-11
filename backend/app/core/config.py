"""
Configuration settings for the FastAPI application
Centralizes all app configuration and environment variables
"""

from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # API Configuration
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Código para Todos API"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "Backend API for programming learning platform"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True
    
    # CORS Configuration
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:4200",  # Angular dev
        "http://localhost:3000",  # React dev
        "http://127.0.0.1:4200",
        "http://127.0.0.1:3000"
    ]
    
    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours
    
    # Mock Data Settings
    ENABLE_MOCK_DATA: bool = True
    MOCK_DELAY_SECONDS: float = 0.5
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()