"""
Diagnostic evaluation-related Pydantic models
Models for questions, answers, sessions, and evaluation results
"""

from pydantic import BaseModel, Field
from typing import Any, List, Dict, Optional
from datetime import datetime
from app.models.common import DifficultyLevel, BaseResponse

class Question(BaseModel):
    """Question model for diagnostic evaluation"""
    id: int = Field(..., description="Unique question identifier")
    question: str = Field(..., min_length=1, description="Question text")
    options: List[str] = Field(..., min_items=2, max_items=6, description="Answer options")
    correct_answer: int = Field(..., ge=0, description="Index of correct answer")
    difficulty: DifficultyLevel = Field(..., description="Question difficulty level")
    topic: str = Field(..., min_length=1, description="Question topic/category")

class UserAnswer(BaseModel):
    """User's answer to a question"""
    question_id: int = Field(..., description="ID of the answered question")
    selected_option: int = Field(..., ge=0, description="Index of selected option")
    time_spent: int = Field(..., ge=0, description="Time spent on question in milliseconds")
    difficulty: str = Field(..., description="Question difficulty level")

class EvaluationSession(BaseModel):
    """Evaluation session model"""
    session_id: str = Field(..., description="Unique session identifier")
    user_id: str = Field(..., description="User ID taking the evaluation")
    start_time: datetime = Field(default_factory=datetime.now, description="Session start time")
    current_question_index: int = Field(0, ge=0, description="Current question index")
    answers: List[UserAnswer] = Field(default_factory=list, description="User's answers")
    is_completed: bool = Field(False, description="Whether evaluation is completed")

class EvaluationResult(BaseModel):
    """Final evaluation result"""
    level: DifficultyLevel = Field(..., description="Determined user level")
    score: int = Field(..., ge=0, le=100, description="Overall score percentage")
    topics: Dict[str, float] = Field(..., description="Score per topic (percentage)")
    learning_style: str = Field(..., description="Determined learning style")
    recommendations: List[str] = Field(..., description="Personalized recommendations")

class StartEvaluationRequest(BaseModel):
    """Request to start evaluation session"""
    user_id: str = Field(..., description="User ID starting the evaluation")

class SubmitAnswerRequest(BaseModel):
    """Request to submit an answer"""
    session_id: str = Field(..., description="Current session ID")
    answer: UserAnswer = Field(..., description="User's answer")

class SubmitAnswerResponse(BaseResponse):
    """Response after submitting an answer"""
    next_question: Optional[Question] = Field(None, description="Next question if available")
    is_completed: bool = Field(..., description="Whether evaluation is completed")

class EvaluationResultResponse(BaseResponse):
    """Response containing evaluation results"""
    result: EvaluationResult = Field(..., description="Evaluation results")
    session: EvaluationSession = Field(..., description="Session information")

class AdaptiveQuestionRequest(BaseModel):
    """Request for adaptive questions"""
    session_id: str = Field(..., description="Current session ID")

class AdaptiveAnswer(BaseModel):
    """Model for adaptive answer context"""
    question_id: int
    selected_option: int
    is_correct: bool
    difficulty: str
    time_spent: int

class AlternativePath(BaseModel):
    """Model for alternative question paths"""
    question_id: int
    question_text: str
    difficulty: str
    topic: str
    options: List[str]
    correct_answer: int
    condition: str  # 'if_correct' or 'if_incorrect'
    explanation: str
    would_lead_to: str

class GetNextAdaptiveQuestionRequest(BaseModel):
    """Request model for getting next adaptive question"""
    answers: List[AdaptiveAnswer]
    assume_answer: Optional[Dict[str, Any]] = None

class GetAlternativePathsRequest(BaseModel):
    """Request model for getting alternative paths"""
    answers: List[AdaptiveAnswer]
    current_question_id: int

class NextAdaptiveQuestionResponse(BaseModel):
    """Response model for next adaptive question"""
    question: Optional[Question] = None

class AlternativePathsResponse(BaseModel):
    """Response model for alternative paths"""
    alternatives: List[AlternativePath]