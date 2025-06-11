"""
Diagnostic evaluation service
Business logic for adaptive testing, question selection, and result calculation
"""

import random
import uuid
from datetime import datetime
from typing import List, Optional, Dict
from app.models.diagnostic import (
    Question, EvaluationSession, UserAnswer, EvaluationResult, 
    SubmitAnswerResponse, StartEvaluationRequest
)
from app.models.common import DifficultyLevel
from app.utils.mock_data import mock_data

class DiagnosticService:
    """Service class for diagnostic evaluation operations"""
    
    def __init__(self):
        self.mock_data = mock_data
        self.active_sessions: Dict[str, EvaluationSession] = {}
    
    async def start_evaluation_session(self, user_id: str) -> EvaluationSession:
        """
        Start a new evaluation session for a user
        """
        session = EvaluationSession(
            session_id=self._generate_session_id(),
            user_id=user_id,
            start_time=datetime.now(),
            current_question_index=0,
            answers=[],
            is_completed=False
        )
        
        # Store session in memory (in production, store in database)
        self.active_sessions[session.session_id] = session
        
        return session
    
    async def get_questions(self) -> List[Question]:
        """
        Get all available questions for evaluation
        In production, this might filter based on user's previous evaluations
        """
        return self.mock_data.questions
    
    async def get_adaptive_questions(self, session_id: str) -> List[Question]:
        """
        Get adaptive questions based on user's current session performance
        """
        session = self.active_sessions.get(session_id)
        if not session:
            return self.mock_data.questions
        
        # For now, return all questions
        # In production, this would use AI to select optimal questions
        return self.mock_data.questions
    
    async def submit_answer(self, session_id: str, answer: UserAnswer) -> SubmitAnswerResponse:
        """
        Submit an answer and get the next question or completion status
        """
        session = self.active_sessions.get(session_id)
        if not session:
            return SubmitAnswerResponse(
                success=False,
                message="Sesión no encontrada",
                is_completed=True
            )
        
        # Add answer to session
        session.answers.append(answer)
        session.current_question_index += 1
        
        # Check if evaluation should end
        should_end = self._should_end_evaluation(session)
        
        if should_end:
            session.is_completed = True
            return SubmitAnswerResponse(
                success=True,
                message="Evaluación completada",
                is_completed=True
            )
        
        # Get next adaptive question
        next_question = self._get_next_adaptive_question(session)
        
        return SubmitAnswerResponse(
            success=True,
            next_question=next_question,
            is_completed=False
        )
    
    async def calculate_results(self, session_id: str) -> EvaluationResult:
        """
        Calculate final evaluation results using performance analysis
        """
        session = self.active_sessions.get(session_id)
        if not session or not session.answers:
            raise ValueError("Sesión no válida o sin respuestas")
        
        answers = session.answers
        questions = self.mock_data.questions
        
        # Calculate scores
        correct_answers = 0
        topic_scores: Dict[str, Dict[str, int]] = {}
        difficulty_performance = {
            DifficultyLevel.BASIC: 0,
            DifficultyLevel.INTERMEDIATE: 0,
            DifficultyLevel.ADVANCED: 0
        }
        
        for answer in answers:
            question = next((q for q in questions if q.id == answer.question_id), None)
            if not question:
                continue
            
            is_correct = answer.selected_option == question.correct_answer
            if is_correct:
                correct_answers += 1
            
            # Track topic performance
            if question.topic not in topic_scores:
                topic_scores[question.topic] = {"correct": 0, "total": 0}
            topic_scores[question.topic]["total"] += 1
            if is_correct:
                topic_scores[question.topic]["correct"] += 1
            
            # Track difficulty performance
            if is_correct:
                difficulty_performance[question.difficulty] += 1
        
        # Calculate overall score
        score = round((correct_answers / len(answers)) * 100) if answers else 0
        
        # Determine user level based on difficulty performance
        level = self._determine_user_level(difficulty_performance, score)
        
        # Convert topic scores to percentages
        topics = {}
        for topic, scores in topic_scores.items():
            percentage = round((scores["correct"] / scores["total"]) * 100) if scores["total"] > 0 else 0
            topics[topic] = percentage
        
        # Determine learning style based on time spent
        average_time = sum(a.time_spent for a in answers) / len(answers) if answers else 0
        learning_style = "Reflexivo" if average_time > 30000 else "Práctico"  # 30 seconds threshold
        
        # Generate recommendations
        recommendations = self._generate_recommendations(level, topics, learning_style)
        
        return EvaluationResult(
            level=level,
            score=score,
            topics=topics,
            learning_style=learning_style,
            recommendations=recommendations
        )
    
    async def save_results(self, session_id: str, result: EvaluationResult) -> Dict[str, str]:
        """
        Save evaluation results to database
        In production, this would persist to a real database
        """
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError("Sesión no encontrada")
        
        # Mock save operation
        print(f"Guardando resultados para sesión {session_id}: {result.level}, {result.score}%")
        
        return {"success": True, "id": session_id}
    
    async def get_evaluation_history(self, user_id: str) -> List[EvaluationResult]:
        """
        Get user's evaluation history
        In production, this would query the database
        """
        # Return empty list for now - no historical data in mock
        return []
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"eval_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
    
    def _should_end_evaluation(self, session: EvaluationSession) -> bool:
        """
        Determine if evaluation should end based on adaptive logic
        """
        answers = session.answers
        
        # Minimum 3 questions, maximum 10
        if len(answers) < 3:
            return False
        if len(answers) >= 10:
            return True
        
        # End if we have enough data to determine level confidently
        if len(answers) >= 3:
            recent_answers = answers[-3:]
            recent_correct = sum(1 for a in recent_answers 
                               if self._is_answer_correct(a))
            
            # If last 3 answers show consistent performance, we can end
            return recent_correct == 0 or recent_correct == 3
        
        return False
    
    def _get_next_adaptive_question(self, session: EvaluationSession) -> Optional[Question]:
        """
        Select next question based on adaptive logic
        """
        answered_ids = [a.question_id for a in session.answers]
        available_questions = [q for q in self.mock_data.questions 
                             if q.id not in answered_ids]
        
        if not available_questions:
            return None
        
        # Simple adaptive logic - adjust based on recent performance
        if len(session.answers) >= 2:
            recent_answers = session.answers[-2:]
            recent_correct = sum(1 for a in recent_answers 
                               if self._is_answer_correct(a))
            
            # Determine target difficulty
            if recent_correct == 2:
                # Increase difficulty
                target_difficulties = [DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
            elif recent_correct == 0:
                # Decrease difficulty
                target_difficulties = [DifficultyLevel.BASIC, DifficultyLevel.INTERMEDIATE]
            else:
                # Maintain current level
                target_difficulties = [DifficultyLevel.BASIC, DifficultyLevel.INTERMEDIATE, DifficultyLevel.ADVANCED]
            
            # Find question with target difficulty
            for difficulty in target_difficulties:
                questions = [q for q in available_questions if q.difficulty == difficulty]
                if questions:
                    return random.choice(questions)
        
        # Fallback: return any available question
        return available_questions[0] if available_questions else None
    
    def _is_answer_correct(self, answer: UserAnswer) -> bool:
        """Check if an answer is correct"""
        question = next((q for q in self.mock_data.questions 
                        if q.id == answer.question_id), None)
        return question and answer.selected_option == question.correct_answer
    
    def _determine_user_level(self, difficulty_performance: Dict[DifficultyLevel, int], score: int) -> DifficultyLevel:
        """Determine user level based on difficulty performance and score"""
        if difficulty_performance[DifficultyLevel.ADVANCED] >= 2 and score >= 75:
            return DifficultyLevel.ADVANCED
        elif difficulty_performance[DifficultyLevel.INTERMEDIATE] >= 2 and score >= 60:
            return DifficultyLevel.INTERMEDIATE
        else:
            return DifficultyLevel.BASIC
    
    def _generate_recommendations(self, level: DifficultyLevel, topics: Dict[str, int], 
                                learning_style: str) -> List[str]:
        """Generate personalized recommendations based on evaluation results"""
        recommendations = []
        
        # Level-based recommendations
        if level == DifficultyLevel.BASIC:
            recommendations.extend([
                "Comienza con ejercicios básicos de sintaxis de Java",
                "Practica declaración y uso de variables"
            ])
        elif level == DifficultyLevel.INTERMEDIATE:
            recommendations.extend([
                "Enfócate en estructuras de control y bucles",
                "Practica con arreglos y métodos"
            ])
        else:  # ADVANCED
            recommendations.extend([
                "Estudia patrones de diseño y arquitectura de software",
                "Practica algoritmos de complejidad avanzada"
            ])
        
        # Topic-based recommendations
        for topic, score in topics.items():
            if score < 60:
                recommendations.append(f"Refuerza tus conocimientos en {topic}")
        
        # Learning style recommendations
        if learning_style == "Reflexivo":
            recommendations.append("Dedica tiempo a leer documentación antes de practicar")
        else:
            recommendations.append("Aprendes mejor practicando directamente con código")
        
        return recommendations

# Global service instance
diagnostic_service = DiagnosticService()