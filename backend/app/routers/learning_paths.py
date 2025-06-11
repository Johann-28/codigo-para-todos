"""
Learning paths router
Endpoints for learning paths, courses, lessons, and progress management
"""

import asyncio
from typing import List, Optional
from fastapi import APIRouter, HTTPException, status, Query
from app.models.learning import (
    LearningPath, CourseModule, Lesson, CourseProgress,
    EnrollmentRequest, ProgressUpdateRequest, LessonCompletionRequest
)
from app.models.diagnostic import EvaluationResult
from app.models.common import BaseResponse, DifficultyLevel
from app.services.learning_services import learning_service
from  app.core.config import settings

router = APIRouter()

@router.get("/", response_model=List[LearningPath])
async def get_learning_paths():
    """
    Get all available learning paths
    Returns complete list of courses with basic information
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.5)
    
    try:
        paths = await learning_service.get_learning_paths()
        return paths
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener rutas de aprendizaje"
        )

@router.get("/by-difficulty", response_model=List[LearningPath])
async def get_learning_paths_by_difficulty(
    difficulty: DifficultyLevel = Query(..., description="Difficulty level to filter by")
):
    """
    Get learning paths filtered by difficulty level
    
    - **difficulty**: Filter by basic, intermediate, or advanced
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        paths = await learning_service.get_learning_paths_by_difficulty(difficulty)
        return paths
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al filtrar rutas por dificultad"
        )

@router.get("/recommended/{user_id}", response_model=List[LearningPath])
async def get_recommended_paths(
    user_id: str,
    evaluation_level: Optional[DifficultyLevel] = Query(None, description="User's evaluation level")
):
    """
    Get recommended learning paths based on user's evaluation
    
    - **user_id**: User's unique identifier
    - **evaluation_level**: Optional user's determined level from evaluation
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.4)
    
    try:
        # Create mock evaluation result if level provided
        evaluation_result = None
        if evaluation_level:
            evaluation_result = EvaluationResult(
                level=evaluation_level,
                score=75,  # Mock score
                topics={},
                learning_style="Practical",
                recommendations=[]
            )
        
        paths = await learning_service.get_recommended_paths(user_id, evaluation_result)
        return paths
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener recomendaciones"
        )

@router.post("/enroll", response_model=BaseResponse)
async def enroll_in_path(enrollment: EnrollmentRequest):
    """
    Enroll user in a learning path
    
    - **user_id**: User's unique identifier
    - **path_id**: Learning path ID to enroll in
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        await learning_service.enroll_in_path(enrollment.user_id, enrollment.path_id)
        return BaseResponse(
            success=True,
            message="Inscripción exitosa en la ruta de aprendizaje"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al inscribirse en la ruta"
        )

@router.put("/progress", response_model=BaseResponse)
async def update_path_progress(progress_update: ProgressUpdateRequest):
    """
    Update user's progress in a learning path
    
    - **user_id**: User's unique identifier
    - **path_id**: Learning path ID
    - **progress**: Progress percentage (0-100)
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.25)
    
    try:
        await learning_service.update_path_progress(
            progress_update.user_id, 
            progress_update.path_id, 
            progress_update.progress
        )
        return BaseResponse(
            success=True,
            message="Progreso actualizado exitosamente"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al actualizar progreso"
        )

@router.get("/{path_id}/content", response_model=List[CourseModule])
async def get_course_content(path_id: str):
    """
    Get detailed course content for a specific learning path
    
    - **path_id**: Learning path unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.4)
    
    try:
        content = await learning_service.get_course_content(path_id)
        return content
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener contenido del curso"
        )

@router.get("/{path_id}/progress/{user_id}", response_model=CourseProgress)
async def get_course_progress(path_id: str, user_id: str):
    """
    Get course progress summary for a user
    
    - **path_id**: Learning path unique identifier
    - **user_id**: User's unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        progress = await learning_service.get_course_progress(user_id, path_id)
        return progress
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener progreso del curso"
        )

@router.get("/lessons/{lesson_id}", response_model=Lesson)
async def get_lesson_content(lesson_id: str):
    """
    Get specific lesson content
    
    - **lesson_id**: Lesson unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.2)
    
    try:
        lesson = await learning_service.get_lesson_content(lesson_id)
        if not lesson:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Lección no encontrada"
            )
        return lesson
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener contenido de la lección"
        )

@router.put("/lessons/complete", response_model=BaseResponse)
async def complete_lesson(completion: LessonCompletionRequest):
    """
    Mark a lesson as completed for a user
    
    - **user_id**: User's unique identifier
    - **lesson_id**: Lesson ID to mark as completed
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.25)
    
    try:
        await learning_service.complete_lesson(completion.user_id, completion.lesson_id)
        return BaseResponse(
            success=True,
            message="Lección completada exitosamente"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al completar lección"
        )