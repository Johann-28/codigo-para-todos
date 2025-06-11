"""
Diagnostic evaluation router
Endpoints for adaptive testing, question management, and result calculation
"""

import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from app.models.diagnostic import (
    Question, EvaluationSession, EvaluationResult, 
    StartEvaluationRequest, SubmitAnswerRequest, SubmitAnswerResponse,
    EvaluationResultResponse, AdaptiveQuestionRequest, UserAnswer
)
from app.models.common import BaseResponse
from app.services.diagnostic_service import diagnostic_service
from app.core.config import settings

router = APIRouter()

@router.post("/start-session", response_model=EvaluationSession)
async def start_evaluation_session(request: StartEvaluationRequest):
    """
    Start a new diagnostic evaluation session
    
    - **user_id**: ID of the user taking the evaluation
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        session = await diagnostic_service.start_evaluation_session(request.user_id)
        return session
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al iniciar sesión de evaluación"
        )

@router.get("/questions", response_model=List[Question])
async def get_questions():
    """
    Get all available questions for diagnostic evaluation
    Used for initial question set or manual question selection
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.5)
    
    try:
        questions = await diagnostic_service.get_questions()
        return questions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener preguntas"
        )

@router.get("/questions/{session_id}/adaptive", response_model=List[Question])
async def get_adaptive_questions(session_id: str):
    """
    Get adaptive questions based on user's current performance
    
    - **session_id**: Current evaluation session ID
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.5)
    
    try:
        questions = await diagnostic_service.get_adaptive_questions(session_id)
        return questions
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener preguntas adaptativas"
        )

@router.post("/submit-answer", response_model=SubmitAnswerResponse)
async def submit_answer(request: SubmitAnswerRequest):
    """
    Submit an answer and get next question or completion status
    
    - **session_id**: Current evaluation session ID
    - **answer**: User's answer data including question_id, selected_option, and time_spent
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        result = await diagnostic_service.submit_answer(request.session_id, request.answer)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar respuesta"
        )

@router.post("/calculate-results/{session_id}", response_model=EvaluationResultResponse)
async def calculate_results(session_id: str):
    """
    Calculate final evaluation results using AI analysis
    
    - **session_id**: Completed evaluation session ID
    """
    # Simulate network delay for AI processing
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(1.0)
    
    try:
        result = await diagnostic_service.calculate_results(session_id)
        
        # Get session info for response
        session = diagnostic_service.active_sessions.get(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesión no encontrada"
            )
        
        return EvaluationResultResponse(
            success=True,
            message="Resultados calculados exitosamente",
            result=result,
            session=session
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al calcular resultados"
        )

@router.post("/save-results/{session_id}", response_model=BaseResponse)
async def save_results(session_id: str):
    """
    Save evaluation results to database
    
    - **session_id**: Session ID with calculated results to save
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.5)
    
    try:
        # First calculate results to get them
        result = await diagnostic_service.calculate_results(session_id)
        
        # Then save them
        save_result = await diagnostic_service.save_results(session_id, result)
        
        return BaseResponse(
            success=True,
            message="Resultados guardados exitosamente"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al guardar resultados"
        )

@router.get("/history/{user_id}", response_model=List[EvaluationResult])
async def get_evaluation_history(user_id: str):
    """
    Get user's evaluation history
    
    - **user_id**: User's unique identifier
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        history = await diagnostic_service.get_evaluation_history(user_id)
        return history
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener historial de evaluaciones"
        )

@router.get("/session/{session_id}", response_model=EvaluationSession)
async def get_session(session_id: str):
    """
    Get current evaluation session details
    
    - **session_id**: Session ID to retrieve
    """
    try:
        session = diagnostic_service.active_sessions.get(session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Sesión no encontrada"
            )
        return session
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener sesión"
        )