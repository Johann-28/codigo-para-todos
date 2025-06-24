"""
Diagnostic evaluation router
Endpoints for adaptive testing, question management, and result calculation
"""

import asyncio
from typing import List
from fastapi import APIRouter, HTTPException, status, Query
from app.models.diagnostic import (
    AlternativePath, AlternativePathsResponse, GetAlternativePathsRequest, GetNextAdaptiveQuestionRequest, NextAdaptiveQuestionResponse, Question, EvaluationSession, EvaluationResult, 
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
    

@router.post("/get-next-adaptive-question", response_model=NextAdaptiveQuestionResponse)
async def get_next_adaptive_question(request: GetNextAdaptiveQuestionRequest):
    """
    Get next adaptive question based on answer context
    Used for tree visualization and what-if scenarios
    
    - **answers**: List of previous answers for context
    - **assume_answer**: Optional assumed answer to simulate different paths
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.3)
    
    try:
        # Convert request data to internal format
        answers_data = []
        for answer in request.answers:
            answers_data.append({
                'question_id': answer.question_id,
                'selected_option': answer.selected_option,
                'is_correct': answer.is_correct,
                'difficulty': answer.difficulty,
                'time_spent': answer.time_spent
            })
        
        assume_answer_data = None
        if request.assume_answer:
            assume_answer_data = {
                'questionId': request.assume_answer.get('questionId'),
                'selectedOption': request.assume_answer.get('selectedOption'),
                'isCorrect': request.assume_answer.get('isCorrect')
            }
        
        # Get next question using service
        next_question = await diagnostic_service.get_next_adaptive_question_context(
            answers_data, 
            assume_answer_data
        )
        
        return NextAdaptiveQuestionResponse(question=next_question)
        
    except Exception as e:
        print(f"Error in get_next_adaptive_question endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener siguiente pregunta adaptativa"
        )

@router.post("/get-alternative-paths", response_model=AlternativePathsResponse)
async def get_alternative_paths(request: GetAlternativePathsRequest):
    """
    Get alternative path information for tree visualization
    Shows what would happen with different answer choices
    
    - **answers**: List of previous answers for context
    - **current_question_id**: ID of the current question to analyze alternatives for
    """
    # Simulate network delay
    if settings.ENABLE_MOCK_DATA:
        await asyncio.sleep(0.4)
    
    try:
        # Convert request data to internal format
        answers_data = []
        for answer in request.answers:
            answers_data.append({
                'question_id': answer.question_id,
                'selected_option': answer.selected_option,
                'is_correct': answer.is_correct,
                'difficulty': answer.difficulty,
                'time_spent': answer.time_spent
            })
        
        # Get alternative paths using service
        alternatives_data = await diagnostic_service.get_alternative_paths_info(
            answers_data,
            request.current_question_id
        )
        
        # Convert to response format
        alternatives = []
        for alt_data in alternatives_data:
            alternative = AlternativePath(
                question_id=alt_data['question_id'],
                question_text=alt_data['question_text'],
                difficulty=alt_data['difficulty'],
                topic=alt_data['topic'],
                options=alt_data['options'],
                correct_answer=alt_data['correct_answer'],
                condition=alt_data['condition'],
                explanation=alt_data['explanation'],
                would_lead_to=alt_data['would_lead_to']
            )
            alternatives.append(alternative)
        
        return AlternativePathsResponse(alternatives=alternatives)
        
    except Exception as e:
        print(f"Error in get_alternative_paths endpoint: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al obtener caminos alternativos"
        )