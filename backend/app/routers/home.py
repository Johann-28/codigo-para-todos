"""
Home/Dashboard router
Endpoints for dashboard data, achievements, daily tips, and user statistics
"""

import asyncio
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException, status, Query
from app.models.learning import Achievement, DailyTip
from app.models.common import UserStats, BaseResponse
from app.services.learning_services import learning_service
from app.core.config import settings

router = APIRouter()

@router.get("/achievements/{user_id}/recent", response_model=List[Achievement])
async def get_recent_achievements(
    user_id: str,
    limit: int = Query(5, ge=1, le=20, description="Number of recent achievements to return")
):
    """
    Get user's recent achievements for dashboard display
    
    - **user_id**: User's unique identifier
    - **limit**: Maximum number of achievements to return (default: 5)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        achievements = await learning_service.get_recent_achievements(user_id, limit)
        return achievements
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener logros recientes"
        )

@router.get("/achievements/{user_id}", response_model=List[Achievement])
async def get_all_achievements(user_id: str):
    """
    Get all user achievements
    
    - **user_id**: User's unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.4)
    
    try:
        achievements = await learning_service.get_all_achievements(user_id)
        return achievements
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener todos los logros"
        )

@router.get("/stats/{user_id}", response_model=UserStats)
async def get_user_stats(user_id: str):
    """
    Get user statistics and progress for dashboard
    
    - **user_id**: User's unique identifier
    
    Returns comprehensive user statistics including:
    - Total points earned
    - Completed learning paths
    - Current learning streak
    - Total achievements
    - Weekly learning goal and progress
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.35)
    
    try:
        stats = await learning_service.get_user_stats(user_id)
        return stats
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener estadísticas del usuario"
        )

@router.get("/daily-tip", response_model=DailyTip)
async def get_daily_tip():
    """
    Get daily learning tip for motivation and guidance
    
    Returns a randomly selected tip from available categories:
    - Programming tips
    - Learning strategies
    - Motivation
    - Career advice
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.2)
    
    try:
        tip = await learning_service.get_daily_tip()
        return tip
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener consejo diario"
        )

@router.get("/dashboard/{user_id}", response_model=Dict[str, Any])
async def get_dashboard_data(user_id: str):
    """
    Get comprehensive dashboard data for user's home page
    
    - **user_id**: User's unique identifier
    
    Returns consolidated data including:
    - User statistics
    - Recent achievements
    - Daily tip
    - Learning path progress
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.6)
    
    try:
        # Gather all dashboard data concurrently
        stats_task = learning_service.get_user_stats(user_id)
        achievements_task = learning_service.get_recent_achievements(user_id, 3)
        tip_task = learning_service.get_daily_tip()
        progress_task = learning_service.get_user_path_progress(user_id)
        
        # Wait for all tasks to complete
        stats = await stats_task
        achievements = await achievements_task
        daily_tip = await tip_task
        path_progress = await progress_task
        
        return {
            "user_stats": stats,
            "recent_achievements": achievements,
            "daily_tip": daily_tip,
            "path_progress": path_progress,
            "last_updated": settings.PROJECT_NAME
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener datos del dashboard"
        )

@router.get("/progress/{user_id}", response_model=List[Dict[str, Any]])
async def get_user_progress(user_id: str):
    """
    Get user's progress across all enrolled learning paths
    
    - **user_id**: User's unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        progress = await learning_service.get_user_path_progress(user_id)
        return progress
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener progreso del usuario"
        )