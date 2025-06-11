"""
Mock data generation for development and testing
Contains all the sample data for users, courses, questions, etc.
"""

from datetime import datetime, timedelta
from typing import List, Dict
import random
from app.models.auth import User, UserPreferences
from app.models.learning import LearningPath, CourseModule, Lesson, Achievement, DailyTip, Instructor, CourseRating
from app.models.diagnostic import Question
from app.models.common import DifficultyLevel, LessonType, UserRole, Theme, Language, UserStats

class MockDataGenerator:
    """Centralized mock data generator for the application"""
    
    def __init__(self):
        self._users = self._generate_mock_users()
        self._learning_paths = self._generate_mock_learning_paths()
        self._questions = self._generate_mock_questions()
        self._achievements = self._generate_mock_achievements()
        self._daily_tips = self._generate_mock_daily_tips()
    
    @property
    def users(self) -> List[User]:
        return self._users
    
    @property
    def learning_paths(self) -> List[LearningPath]:
        return self._learning_paths
    
    @property
    def questions(self) -> List[Question]:
        return self._questions
    
    @property
    def achievements(self) -> List[Achievement]:
        return self._achievements
    
    @property
    def daily_tips(self) -> List[DailyTip]:
        return self._daily_tips
    
    def get_user_by_email(self, email: str) -> User | None:
        """Get user by email"""
        return next((user for user in self._users if user.email == email), None)
    
    def get_user_by_id(self, user_id: str) -> User | None:
        """Get user by ID"""
        return next((user for user in self._users if user.id == user_id), None)
    
    def get_learning_path_by_id(self, path_id: str) -> LearningPath | None:
        """Get learning path by ID"""
        return next((path for path in self._learning_paths if path.id == path_id), None)
    
    def get_user_stats(self, user_id: str) -> UserStats:
        """Generate mock user statistics"""
        return UserStats(
            total_points=random.randint(100, 1000),
            completed_paths=random.randint(0, 3),
            current_streak=random.randint(0, 15),
            total_achievements=len(self._achievements),
            weekly_goal=10,
            weekly_progress=random.uniform(3.0, 9.5)
        )
    
    def _generate_mock_users(self) -> List[User]:
        """Generate mock users for testing"""
        base_time = datetime.now()
        return [
            User(
                id="1",
                first_name="Juan",
                last_name="Pérez",
                email="juan@email.com",
                avatar="👨‍💻",
                role=UserRole.STUDENT,
                enrolled_courses=["basic-programming", "web-development"],
                completed_courses=[],
                preferences=UserPreferences(theme=Theme.LIGHT, language=Language.ES, notifications=True),
                created_at=base_time - timedelta(days=150),
                last_login_at=base_time
            ),
            User(
                id="2",
                first_name="María",
                last_name="García",
                email="maria@email.com",
                avatar="👩‍💻",
                role=UserRole.STUDENT,
                enrolled_courses=["basic-programming"],
                completed_courses=[],
                preferences=UserPreferences(theme=Theme.DARK, language=Language.ES, notifications=False),
                created_at=base_time - timedelta(days=120),
                last_login_at=base_time
            ),
            User(
                id="3",
                first_name="Admin",
                last_name="Sistema",
                email="admin@email.com",
                avatar="🔧",
                role=UserRole.ADMIN,
                enrolled_courses=[],
                completed_courses=[],
                preferences=UserPreferences(theme=Theme.LIGHT, language=Language.ES, notifications=True),
                created_at=base_time - timedelta(days=365),
                last_login_at=base_time
            )
        ]
    
    def _generate_mock_learning_paths(self) -> List[LearningPath]:
        """Generate mock learning paths with full course content"""
        return [
            LearningPath(
                id="basic-programming",
                title="Fundamentos de Programación",
                description="Aprende los conceptos básicos de programación desde cero con ejercicios prácticos en Java",
                difficulty=DifficultyLevel.BASIC,
                estimated_time="8-10 semanas",
                modules=8,
                icon="🎯",
                color="#10b981",
                progress=0,
                instructor=Instructor(name="Prof. María González", avatar="👩‍🏫", rating=4.9),
                rating=CourseRating(average=4.8, total_reviews=1247),
                is_popular=True,
                category="programming",
                content=self._generate_basic_programming_modules()
            ),
            LearningPath(
                id="web-development",
                title="Desarrollo Web Frontend",
                description="HTML, CSS, JavaScript y frameworks modernos como React y Angular",
                difficulty=DifficultyLevel.INTERMEDIATE,
                estimated_time="8-10 semanas",
                modules=12,
                icon="🌐",
                color="#3b82f6",
                progress=25
            ),
            LearningPath(
                id="backend-development",
                title="Desarrollo Backend",
                description="APIs REST, bases de datos, Node.js y arquitectura de servidores",
                difficulty=DifficultyLevel.INTERMEDIATE,
                estimated_time="10-12 semanas",
                modules=15,
                icon="⚙️",
                color="#8b5cf6",
                progress=0
            ),
            LearningPath(
                id="mobile-development",
                title="Desarrollo Móvil",
                description="Crea aplicaciones nativas con React Native y Flutter",
                difficulty=DifficultyLevel.ADVANCED,
                estimated_time="12-14 semanas",
                modules=18,
                icon="📱",
                color="#f59e0b",
                progress=0
            ),
            LearningPath(
                id="data-science",
                title="Ciencia de Datos",
                description="Python, análisis de datos, machine learning y visualización",
                difficulty=DifficultyLevel.ADVANCED,
                estimated_time="14-16 semanas",
                modules=20,
                icon="📊",
                color="#ef4444",
                progress=0
            ),
            LearningPath(
                id="devops",
                title="DevOps y Cloud",
                description="Docker, Kubernetes, CI/CD y despliegue en AWS/Azure",
                difficulty=DifficultyLevel.ADVANCED,
                estimated_time="10-12 semanas",
                modules=14,
                icon="☁️",
                color="#06b6d4",
                progress=0
            ),
            LearningPath(
                id="cybersecurity",
                title="Ciberseguridad",
                description="Seguridad en aplicaciones, pentesting y ethical hacking",
                difficulty=DifficultyLevel.ADVANCED,
                estimated_time="8-10 semanas",
                modules=12,
                icon="🔒",
                color="#dc2626",
                progress=0
            ),
            LearningPath(
                id="ui-ux-design",
                title="Diseño UI/UX",
                description="Principios de diseño, Figma, prototipado y experiencia de usuario",
                difficulty=DifficultyLevel.INTERMEDIATE,
                estimated_time="6-8 semanas",
                modules=10,
                icon="🎨",
                color="#e11d48",
                progress=0
            )
        ]
    
    def _generate_basic_programming_modules(self) -> List[CourseModule]:
        """Generate detailed modules for basic programming course"""
        return [
            CourseModule(
                id="module-1",
                title="Resolución de Problemas",
                description="Aprende a analizar y resolver problemas de manera sistemática usando diagramas de flujo",
                estimated_time="1 semana",
                order=1,
                is_completed=False,
                lessons=[
                    Lesson(
                        id="lesson-1-1",
                        title="Introducción a la Resolución de Problemas",
                        description="Metodología para abordar problemas computacionales",
                        type=LessonType.VIDEO,
                        estimated_time="30 min",
                        order=1,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-1-2",
                        title="Diagramas de Flujo - Conceptos Básicos",
                        description="Aprende a crear diagramas de flujo para representar algoritmos",
                        type=LessonType.VIDEO,
                        estimated_time="45 min",
                        order=2,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-1-3",
                        title="Práctica: Creando tu Primer Diagrama",
                        description="Ejercicio práctico para crear diagramas de flujo",
                        type=LessonType.EXERCISE,
                        estimated_time="60 min",
                        order=3,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-1-4",
                        title="Quiz: Diagramas de Flujo",
                        description="Evaluación de conocimientos sobre diagramas de flujo",
                        type=LessonType.QUIZ,
                        estimated_time="15 min",
                        order=4,
                        is_completed=False
                    )
                ]
            ),
            CourseModule(
                id="module-2",
                title="Instalación del JDK",
                description="Configura tu entorno de desarrollo Java en tu sistema operativo",
                estimated_time="3 días",
                order=2,
                is_completed=False,
                lessons=[
                    Lesson(
                        id="lesson-2-1",
                        title="¿Qué es el JDK?",
                        description="Introducción al Java Development Kit",
                        type=LessonType.READING,
                        estimated_time="20 min",
                        order=1,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-2-2",
                        title="Instalación en Windows",
                        description="Guía paso a paso para instalar JDK en Windows",
                        type=LessonType.VIDEO,
                        estimated_time="25 min",
                        order=2,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-2-3",
                        title="Instalación en macOS y Linux",
                        description="Instalación del JDK en sistemas Unix",
                        type=LessonType.VIDEO,
                        estimated_time="25 min",
                        order=3,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-2-4",
                        title="Configuración de Variables de Entorno",
                        description="Configura JAVA_HOME y PATH correctamente",
                        type=LessonType.VIDEO,
                        estimated_time="30 min",
                        order=4,
                        is_completed=False
                    ),
                    Lesson(
                        id="lesson-2-5",
                        title="Verificación de la Instalación",
                        description="Prueba que todo esté instalado correctamente",
                        type=LessonType.EXERCISE,
                        estimated_time="15 min",
                        order=5,
                        is_completed=False
                    )
                ]
            )
        ]
    
    def _generate_mock_questions(self) -> List[Question]:
        """Generate mock questions for diagnostic evaluation"""
        return [
            Question(
                id=1,
                question="What is a variable in programming?",
                options=[
                    "A value that never changes",
                    "A memory space to store data",
                    "A mathematical function",
                    "A type of loop"
                ],
                correct_answer=1,
                difficulty=DifficultyLevel.BASIC,
                topic="Variables"
            ),
            Question(
                id=2,
                question="What is the correct syntax to declare a variable in Java?",
                options=[
                    "var x = 5;",
                    "int x = 5;",
                    "variable x = 5;",
                    "declare int x = 5;"
                ],
                correct_answer=1,
                difficulty=DifficultyLevel.BASIC,
                topic="Variables"
            ),
            Question(
                id=3,
                question="What is a 'for' loop in programming?",
                options=[
                    "A data structure",
                    "A control structure that repeats code",
                    "A mathematical function",
                    "A type of variable"
                ],
                correct_answer=1,
                difficulty=DifficultyLevel.INTERMEDIATE,
                topic="Loops"
            ),
            Question(
                id=4,
                question="What is the difference between '==' and '.equals()' in Java?",
                options=[
                    "There is no difference",
                    "== compares references, .equals() compares content",
                    "== is faster than .equals()",
                    ".equals() only works with numbers"
                ],
                correct_answer=1,
                difficulty=DifficultyLevel.INTERMEDIATE,
                topic="Operators"
            ),
            Question(
                id=5,
                question="What is time complexity O(n²) in algorithms?",
                options=[
                    "The algorithm takes constant time",
                    "The time grows quadratically with input size",
                    "The algorithm is linear",
                    "The time cannot be determined"
                ],
                correct_answer=1,
                difficulty=DifficultyLevel.ADVANCED,
                topic="Algorithms"
            ),
            Question(
                id=6,
                question="Which design pattern ensures a class has only one instance?",
                options=["Factory", "Observer", "Singleton", "Strategy"],
                correct_answer=2,
                difficulty=DifficultyLevel.ADVANCED,
                topic="Design Patterns"
            )
        ]
    
    def _generate_mock_achievements(self) -> List[Achievement]:
        """Generate mock achievements"""
        base_time = datetime.now()
        return [
            Achievement(
                id="first-evaluation",
                title="¡Primera Evaluación!",
                description="Completaste tu primera evaluación diagnóstica",
                icon="🏆",
                unlocked_at=base_time - timedelta(hours=2),
                points=100
            ),
            Achievement(
                id="welcome",
                title="Bienvenido a Código para Todos",
                description="Te registraste exitosamente en nuestra plataforma",
                icon="🎉",
                unlocked_at=base_time - timedelta(days=1),
                points=50
            ),
            Achievement(
                id="first-lesson",
                title="Primera Lección Completada",
                description="Completaste tu primera lección de programación",
                icon="📚",
                unlocked_at=base_time - timedelta(hours=4),
                points=75
            )
        ]
    
    def _generate_mock_daily_tips(self) -> List[DailyTip]:
        """Generate mock daily tips"""
        today = datetime.now()
        return [
            DailyTip(
                id="tip-1",
                title="Práctica Diaria",
                content="La programación se aprende mejor practicando todos los días. ¡Dedica al menos 30 minutos diarios a tu aprendizaje!",
                category="learning",
                icon="💡",
                date=today
            ),
            DailyTip(
                id="tip-2",
                title="Debuggear es Aprender",
                content="No te frustres con los errores. Cada bug que resuelves te hace un mejor programador. ¡Los errores son oportunidades de aprendizaje!",
                category="programming",
                icon="🐛",
                date=today
            ),
            DailyTip(
                id="tip-3",
                title="Construye Proyectos",
                content="La mejor manera de consolidar lo aprendido es construyendo proyectos reales. Empieza pequeño y ve creciendo.",
                category="programming",
                icon="🚀",
                date=today
            ),
            DailyTip(
                id="tip-4",
                title="Comunidad es Clave",
                content="Únete a comunidades de desarrolladores. Compartir conocimiento y hacer preguntas acelera tu aprendizaje.",
                category="career",
                icon="👥",
                date=today
            )
        ]

# Global mock data instance
mock_data = MockDataGenerator()