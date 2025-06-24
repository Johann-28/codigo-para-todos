"""
Diagnostic evaluation service using repositories
"""
import random
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from app.models.diagnostic import (
    Question, EvaluationSession, UserAnswer, EvaluationResult, 
    SubmitAnswerResponse
)
from app.models.common import DifficultyLevel
from app.repositories.question_repository import question_repository

class DiagnosticService:
    """Service class for diagnostic evaluation operations using repositories"""
    
    def __init__(self):
        self.question_repo = question_repository
        self.active_sessions: Dict[str, EvaluationSession] = {}
        self._saved_results: Dict[str, Dict] = {}
    
    async def start_evaluation_session(self, user_id: str) -> EvaluationSession:
        """Start a new evaluation session for a user"""
        session = EvaluationSession(
            session_id=self._generate_session_id(),
            user_id=user_id,
            start_time=datetime.now(),
            current_question_index=0,
            answers=[],
            is_completed=False
        )
        
        # Store session in memory
        self.active_sessions[session.session_id] = session
        return session
    
    async def get_questions(self) -> List[Question]:
        """Get all available questions for evaluation"""
        questions_data = self.question_repo.find_all()
        return [self._dict_to_question(q_data) for q_data in questions_data]
    
    async def get_adaptive_questions(self, session_id: str) -> List[Question]:
        """Get adaptive questions based on user's current performance in session"""
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError("Sesión no encontrada")
        
        # Get next adaptive question using repository's adaptive method
        next_question = await self._get_next_adaptive_question(session)
        
        # Return as list for consistency with endpoint
        return [next_question] if next_question else []
    
    async def submit_answer(self, session_id: str, answer: UserAnswer) -> SubmitAnswerResponse:
        """Submit an answer and get the next question or completion status"""
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
        next_question = await self._get_next_adaptive_question(session)
        
        return SubmitAnswerResponse(
            success=True,
            next_question=next_question,
            is_completed=False
        )
    
    async def calculate_results(self, session_id: str) -> EvaluationResult:
        """Calculate final evaluation results"""
        session = self.active_sessions.get(session_id)
        if not session or not session.answers:
            raise ValueError("Sesión no válida o sin respuestas")
        
        # Get all questions for reference
        questions_data = self.question_repo.find_all()
        questions_dict = {q['id']: self._dict_to_question(q) for q in questions_data}
        
        # Calculate scores
        correct_answers = 0
        topic_scores: Dict[str, Dict[str, int]] = {}
        difficulty_performance = {
            DifficultyLevel.BASIC: 0,
            DifficultyLevel.INTERMEDIATE: 0,
            DifficultyLevel.ADVANCED: 0
        }
        
        for answer in session.answers:
            question = questions_dict.get(answer.question_id)
            if not question:
                continue
            
            is_correct = answer.selected_option == question.correct_answer
            if is_correct:
                correct_answers += 1
                question
            
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
        score = round((correct_answers / len(session.answers)) * 100) if session.answers else 0
        
        # Determine user level
        level = self._determine_user_level(difficulty_performance, score)
        
        # Convert topic scores to percentages
        topics = {}
        for topic, scores in topic_scores.items():
            percentage = round((scores["correct"] / scores["total"]) * 100) if scores["total"] > 0 else 0
            topics[topic] = percentage / 100  # Convert to decimal
        
        # Determine learning style
        average_time = sum(a.time_spent for a in session.answers) / len(session.answers) if session.answers else 0
        learning_style = "Reflexivo" if average_time > 30000 else "Práctico"
        
        # Generate recommendations
        recommendations = self._generate_recommendations(level, topics, learning_style)
            
        return EvaluationResult(
            level=level,
            score=score,
            topics=topics,
            learning_style=learning_style,
            recommendations=recommendations
        )
    
    async def save_results(self, session_id: str, result: EvaluationResult) -> bool:
        """Save evaluation results to persistent storage"""
        session = self.active_sessions.get(session_id)
        if not session:
            raise ValueError("Sesión no encontrada")
        
        # Create evaluation result data to save
        result_data = {
            "id": f"result_{session_id}",
            "session_id": session_id,
            "user_id": session.user_id,
            "level": result.level.value,
            "score": result.score,
            "topics": result.topics,
            "learning_style": result.learning_style,
            "recommendations": result.recommendations,
            "start_time": session.start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "total_questions": len(session.answers),
            "correct_answers": sum(1 for a in session.answers if self._is_answer_correct(a))
        }
        
        # Save to memory storage
        self._saved_results[session_id] = result_data
        
        # Remove from active sessions after saving
        if session_id in self.active_sessions:
            del self.active_sessions[session_id]
        
        return True
    
    async def get_evaluation_history(self, user_id: str) -> List[EvaluationResult]:
        """Get user's evaluation history"""
        user_results = []
        for session_id, result_data in self._saved_results.items():
            if result_data['user_id'] == user_id:
                # Convert back to EvaluationResult model
                evaluation_result = EvaluationResult(
                    level=DifficultyLevel(result_data['level']),
                    score=result_data['score'],
                    topics=result_data['topics'],
                    learning_style=result_data['learning_style'],
                    recommendations=result_data['recommendations']
                )
                user_results.append(evaluation_result)
        
        return user_results[-10:]  # Return last 10 evaluations
    
    def get_session_by_id(self, session_id: str) -> Optional[EvaluationSession]:
        """Get session by ID (helper method)"""
        return self.active_sessions.get(session_id)
    
    def cleanup_expired_sessions(self) -> None:
        """Clean up expired sessions (call periodically)"""
        current_time = datetime.now()
        expired_sessions = [
            session_id for session_id, session in self.active_sessions.items()
            if current_time - session.start_time > timedelta(hours=2)
        ]
        
        for session_id in expired_sessions:
            del self.active_sessions[session_id]
    
    # Private helper methods
    async def _get_next_adaptive_question(self, session: EvaluationSession) -> Optional[Question]:
        """Select next question based on adaptive logic using repository"""
        answered_ids = [a.question_id for a in session.answers]
        
        # Determine target difficulty based on performance analysis
        target_difficulty = self._determine_next_difficulty(session)
        
        # Use repository to find questions of the target difficulty
        available_questions_data = self.question_repo.find_by_difficulty(target_difficulty)
        
        # Filter out already answered questions
        available_questions_data = [
            q for q in available_questions_data 
            if q['id'] not in answered_ids
        ]
        
        if not available_questions_data:
            # Fallback: try other difficulties if no questions available
            fallback_difficulties = ["basic", "intermediate", "advanced"]
            for difficulty in fallback_difficulties:
                if difficulty != target_difficulty:
                    fallback_questions = self.question_repo.find_by_difficulty(difficulty)
                    fallback_questions = [
                        q for q in fallback_questions 
                        if q['id'] not in answered_ids
                    ]
                    if fallback_questions:
                        available_questions_data = fallback_questions
                        break
        
        if not available_questions_data:
            return None
        
        # Select question based on topic diversity if possible
        selected_question_data = self._select_diverse_question(available_questions_data, session)
        return self._dict_to_question(selected_question_data)
    
    def _get_target_difficulties(self, session: EvaluationSession) -> List[str]:
        """Determine target difficulties based on session performance"""
        if len(session.answers) < 2:
            return ["basic", "intermediate"]  # Start with easier questions
        
        # Analyze recent performance
        recent_answers = session.answers[-2:]
        recent_correct = sum(1 for a in recent_answers if self._is_answer_correct(a))
        
        # Adaptive logic
        if recent_correct == 2:
            return ["intermediate", "advanced"]
        elif recent_correct == 0:
            return ["basic", "intermediate"]
        else:
            return ["basic", "intermediate", "advanced"]
    
    def _dict_to_question(self, data: dict) -> Question:
        """Convert dictionary to Question model"""
        return Question(
            id=data['id'],
            question=data['question'],
            options=data['options'],
            correct_answer=data['correct_answer'],
            difficulty=DifficultyLevel(data['difficulty']),
            topic=data['topic']
        )
    
    def _determine_next_difficulty(self, session: EvaluationSession) -> str:
        """Determine the next question difficulty based on performance pattern"""
        answers = session.answers
        
        # First question: always start with basic
        if len(answers) == 0:
            return "basic"
        
        # Analyze performance patterns
        performance_analysis = self._analyze_performance_pattern(session)
        
        # Decision logic based on performance
        if performance_analysis["consecutive_correct"] >= 3:
            # 3+ correct in a row: escalate difficulty
            current_level = performance_analysis["current_level"]
            if current_level == "basic":
                return "intermediate"
            elif current_level == "intermediate":
                return "advanced"
            else:
                return "advanced"  # Stay at advanced
        
        elif performance_analysis["consecutive_incorrect"] >= 2:
            # 2+ incorrect in a row: de-escalate difficulty
            current_level = performance_analysis["current_level"]
            if current_level == "advanced":
                return "intermediate"
            elif current_level == "intermediate":
                return "basic"
            else:
                return "basic"  # Stay at basic
        
        elif performance_analysis["recent_accuracy"] >= 0.7:
            # Good recent performance: try next level
            current_level = performance_analysis["current_level"]
            if current_level == "basic":
                return "intermediate"
            elif current_level == "intermediate":
                return "advanced"
            else:
                return "advanced"
        
        elif performance_analysis["recent_accuracy"] <= 0.3:
            # Poor recent performance: go back to easier level
            current_level = performance_analysis["current_level"]
            if current_level == "advanced":
                return "intermediate"
            elif current_level == "intermediate":
                return "basic"
            else:
                return "basic"
        
        else:
            # Maintain current level for mixed performance
            return performance_analysis["current_level"]
    
    def _analyze_performance_pattern(self, session: EvaluationSession) -> Dict[str, any]:
        """Analyze detailed performance patterns"""
        answers = session.answers
        
        if not answers:
            return {
                "consecutive_correct": 0,
                "consecutive_incorrect": 0,
                "recent_accuracy": 0.0,
                "current_level": "basic",
                "difficulty_performance": {"basic": 0, "intermediate": 0, "advanced": 0}
            }
        
        # Calculate consecutive streaks
        consecutive_correct = 0
        consecutive_incorrect = 0
        
        # Count from the end
        for i in range(len(answers) - 1, -1, -1):
            is_correct = self._is_answer_correct(answers[i])
            if is_correct:
                if consecutive_incorrect == 0:
                    consecutive_correct += 1
                else:
                    break
            else:
                if consecutive_correct == 0:
                    consecutive_incorrect += 1
                else:
                    break
        
        # Calculate recent accuracy (last 3 questions)
        recent_answers = answers[-3:]
        recent_correct = sum(1 for a in recent_answers if self._is_answer_correct(a))
        recent_accuracy = recent_correct / len(recent_answers) if recent_answers else 0.0
        
        # Determine current level based on recent questions
        current_level = "basic"
        if recent_answers:
            last_question_data = self.question_repo.find_by_id(recent_answers[-1].question_id)
            if last_question_data:
                current_level = last_question_data.get('difficulty', 'basic')
        
        # Performance by difficulty
        difficulty_performance = {"basic": 0, "intermediate": 0, "advanced": 0}
        for answer in answers:
            question_data = self.question_repo.find_by_id(answer.question_id)
            if question_data and self._is_answer_correct(answer):
                difficulty = question_data.get('difficulty', 'basic')
                difficulty_performance[difficulty] += 1
        
        return {
            "consecutive_correct": consecutive_correct,
            "consecutive_incorrect": consecutive_incorrect,
            "recent_accuracy": recent_accuracy,
            "current_level": current_level,
            "difficulty_performance": difficulty_performance
        }
    
    def _select_diverse_question(self, available_questions: List[Dict], session: EvaluationSession) -> Dict:
        """Select question with topic diversity consideration"""
        if len(available_questions) == 1:
            return available_questions[0]
        
        # Get topics already covered
        covered_topics = set()
        for answer in session.answers:
            question_data = self.question_repo.find_by_id(answer.question_id)
            if question_data:
                covered_topics.add(question_data.get('topic', ''))
        
        # Prefer questions from uncovered topics
        uncovered_questions = [
            q for q in available_questions 
            if q.get('topic', '') not in covered_topics
        ]
        
        if uncovered_questions:
            return random.choice(uncovered_questions)
        else:
            # If all topics covered, select randomly
            return random.choice(available_questions)
    
    def _should_end_evaluation(self, session: EvaluationSession) -> bool:
        """Determine if evaluation should end based on adaptive logic"""
        answers = session.answers
        
        # Minimum questions required
        if len(answers) < 3:
            return False
        
        # Maximum questions limit
        if len(answers) >= 8:  # Increased max for better assessment
            return True
        
        # Analyze performance pattern
        performance_analysis = self._analyze_performance_pattern(session)
        
        # End conditions based on performance patterns
        
        # 1. Strong performance: 3+ correct in a row at advanced level
        if (performance_analysis["consecutive_correct"] >= 3 and 
            performance_analysis["current_level"] == "advanced"):
            return True
        
        # 2. Consistent failure: 3+ incorrect in a row at basic level
        if (performance_analysis["consecutive_incorrect"] >= 3 and 
            performance_analysis["current_level"] == "basic"):
            return True
        
        # 3. Clear level determination: Good performance at one level, poor at next
        if len(answers) >= 5:
            basic_correct = performance_analysis["difficulty_performance"]["basic"]
            intermediate_correct = performance_analysis["difficulty_performance"]["intermediate"]
            advanced_correct = performance_analysis["difficulty_performance"]["advanced"]
            
            # Clear basic level
            if basic_correct >= 2 and intermediate_correct == 0 and len(answers) >= 5:
                return True
            
            # Clear intermediate level
            if intermediate_correct >= 2 and advanced_correct == 0 and len(answers) >= 6:
                return True
            
            # Clear advanced level
            if advanced_correct >= 2 and len(answers) >= 6:
                return True
        
        # 4. Oscillating performance: End after enough questions to determine level
        if len(answers) >= 6:
            recent_accuracy = performance_analysis["recent_accuracy"]
            # If performance is consistently mediocre, end evaluation
            if 0.4 <= recent_accuracy <= 0.6:
                return True
        
        return False
    
    def _is_answer_correct(self, answer: UserAnswer) -> bool:
        """Check if an answer is correct"""
        question_data = self.question_repo.find_by_id(answer.question_id)
        return question_data and answer.selected_option == question_data['correct_answer']
    
    def _determine_user_level(self, difficulty_performance: Dict[DifficultyLevel, int], score: int) -> DifficultyLevel:
        """Determine user level based on performance"""
        if difficulty_performance[DifficultyLevel.ADVANCED] >= 2 and score >= 75:
            return DifficultyLevel.ADVANCED
        elif difficulty_performance[DifficultyLevel.INTERMEDIATE] >= 2 and score >= 60:
            return DifficultyLevel.INTERMEDIATE
        else:
            return DifficultyLevel.BASIC
    
    def _generate_recommendations(self, level: DifficultyLevel, topics: Dict[str, float], learning_style: str) -> List[str]:
        """Generate personalized recommendations"""
        recommendations = []
        
        # Level-based recommendations
        level_recommendations = {
            DifficultyLevel.BASIC: [
                "Comienza con ejercicios básicos de sintaxis de Java",
                "Practica declaración y uso de variables"
            ],
            DifficultyLevel.INTERMEDIATE: [
                "Enfócate en estructuras de control y bucles",
                "Practica con arreglos y métodos"
            ],
            DifficultyLevel.ADVANCED: [
                "Estudia patrones de diseño y arquitectura de software",
                "Practica algoritmos de complejidad avanzada"
            ]
        }
        
        recommendations.extend(level_recommendations[level])
        
        # Topic-based recommendations
        for topic, score in topics.items():
            if score < 0.6:  # Less than 60%
                recommendations.append(f"Refuerza tus conocimientos en {topic}")
        
        # Learning style recommendations
        style_recommendation = (
            "Dedica tiempo a leer documentación antes de practicar" 
            if learning_style == "Reflexivo" 
            else "Aprendes mejor practicando directamente con código"
        )
        recommendations.append(style_recommendation)
        
        return recommendations
    
    def _generate_session_id(self) -> str:
        """Generate unique session ID"""
        return f"eval_{int(datetime.now().timestamp())}_{uuid.uuid4().hex[:8]}"
    
    async def get_next_adaptive_question_context(self, answers: List[dict], assume_answer: Optional[dict] = None) -> Optional[Question]:
        """
        Get next adaptive question based on answer context and optional assumed answer
        Used for tree visualization and what-if scenarios
        """
        try:
            # Create a simulated session with the provided answers
            simulated_answers = []
            
            for answer_data in answers:
                answer = UserAnswer(
                    question_id=answer_data['question_id'],
                    selected_option=answer_data['selected_option'],
                    time_spent=answer_data['time_spent'],
                    difficulty=answer_data['difficulty']
                )
                simulated_answers.append(answer)
            
            # If assume_answer is provided, add it to the context
            if assume_answer:
                assumed_answer = UserAnswer(
                    question_id=assume_answer['questionId'],
                    selected_option=assume_answer['selectedOption'],
                    time_spent=5000,  # Default time
                    difficulty='intermediate'  # Default difficulty
                )
                simulated_answers.append(assumed_answer)
            
            # Create temporary session for analysis
            temp_session = EvaluationSession(
                session_id=f"temp_{datetime.now().timestamp()}",
                user_id="temp_user",
                start_time=datetime.now(),
                current_question_index=len(simulated_answers),
                answers=simulated_answers,
                is_completed=False
            )
            
            # Use existing adaptive logic to determine next question
            next_question = await self._get_next_adaptive_question(temp_session)
            return next_question
            
        except Exception as e:
            print(f"Error getting next adaptive question: {str(e)}")
            return None

    async def get_alternative_paths_info(self, answers: List[dict], current_question_id: int) -> List[dict]:
        """
        Get alternative path information for tree visualization
        Shows what would happen with different answers
        """
        try:
            alternatives = []
            
            # Get current question details
            current_question_data = self.question_repo.find_by_id(current_question_id)
            if not current_question_data:
                return alternatives
            
            current_question = self._dict_to_question(current_question_data)
            
            # Simulate both correct and incorrect answers
            for is_correct in [True, False]:
                # Create assumed answer
                assumed_answer = {
                    'questionId': current_question_id,
                    'selectedOption': current_question.correct_answer if is_correct else (current_question.correct_answer + 1) % len(current_question.options),
                    'isCorrect': is_correct
                }
                
                # Get next question for this scenario
                next_question = await self.get_next_adaptive_question_context(answers, assumed_answer)
                
                if next_question:
                    # Determine the condition and explanation
                    condition = 'if_correct' if is_correct else 'if_incorrect'
                    
                    if is_correct:
                        explanation = "Si hubieras respondido correctamente, habrías avanzado a una pregunta más desafiante o del mismo nivel."
                        would_lead_to = f"Camino hacia {next_question.difficulty} - {next_question.topic}"
                    else:
                        explanation = "Si hubieras respondido incorrectamente, habrías recibido una pregunta más básica para reforzar conceptos."
                        would_lead_to = f"Camino de refuerzo - {next_question.topic}"
                    
                    alternative = {
                        'question_id': next_question.id,
                        'question_text': next_question.question,
                        'difficulty': next_question.difficulty,
                        'topic': next_question.topic,
                        'options': next_question.options,
                        'correct_answer': next_question.correct_answer,
                        'condition': condition,
                        'explanation': explanation,
                        'would_lead_to': would_lead_to
                    }
                    
                    alternatives.append(alternative)
            
            return alternatives
            
        except Exception as e:
            print(f"Error getting alternative paths: {str(e)}")
            return []

    def _determine_difficulty_from_performance(self, answers: List[dict]) -> str:
        """Helper method to determine difficulty based on performance"""
        if not answers:
            return 'basic'
        
        correct_count = sum(1 for answer in answers if answer.get('is_correct', False))
        accuracy = correct_count / len(answers)
        
        if accuracy >= 0.8:
            return 'advanced'
        elif accuracy >= 0.6:
            return 'intermediate'
        else:
            return 'basic'

    def _get_diverse_topic_question(self, available_questions: List[dict], answered_topics: List[str]) -> dict:
        """Get a question from a topic not recently covered"""
        # Prefer questions from topics not recently answered
        for question in available_questions:
            if question.get('topic') not in answered_topics[-3:]:  # Avoid last 3 topics
                return question
        
        # If all topics are recent, return first available
        return available_questions[0] if available_questions else None


# Global service instance
diagnostic_service = DiagnosticService()