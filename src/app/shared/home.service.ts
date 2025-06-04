import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
// import { LearningPath } from '../models/home/learning-path.interface';
import { Achievement } from '../models/home/achievement.interface';
import { EvaluationResult } from '../models/diagnostic-evaluation/evaluation-result.interface';
import { Lesson } from '../models/course-content/lesson.interface';
import { UserStats } from '../models/home/user-stats';

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  estimatedTime: string;
  modules: number;
  icon: string;
  color: string;
  progress?: number;
  enrolled?: boolean;
  lastAccessed?: Date;
  completedModules?: number;
  prerequisites?: string[];
  skills?: string[];
  instructor?: {
    name: string;
    avatar: string;
    rating: number;
  };
  rating?: {
    average: number;
    totalReviews: number;
  };
  isNew?: boolean;
  isPopular?: boolean;
  category?: string;
  content?: CourseModule[];
}

export interface CourseModule {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  isCompleted?: boolean;
  lessons: Lesson[];
  order: number;
}

export interface DailyTip {
  id: string;
  title: string;
  content: string;
  category: 'programming' | 'learning' | 'motivation' | 'career';
  icon: string;
  date: Date;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly apiUrl = '/api'; // Future API endpoint base URL
  
  // Mock data storage (in future, these won't be needed)
  private mockLearningPaths: LearningPath[] = [
    {
      id: 'basic-programming',
      title: 'Fundamentos de Programación',
      description: 'Aprende los conceptos básicos de programación desde cero con ejercicios prácticos en Java',
      difficulty: 'basic',
      estimatedTime: '8-10 semanas',
      modules: 8,
      icon: '🎯',
      color: '#10b981',
      progress: 0,
      instructor: {
        name: 'Prof. María González',
        avatar: '👩‍🏫',
        rating: 4.9
      },
      rating: {
        average: 4.8,
        totalReviews: 1247
      },
      isPopular: true,
      category: 'programming',
      content: [
        {
          id: 'module-1',
          title: 'Resolución de Problemas',
          description: 'Aprende a analizar y resolver problemas de manera sistemática usando diagramas de flujo',
          estimatedTime: '1 semana',
          order: 1,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-1-1',
              title: 'Introducción a la Resolución de Problemas',
              description: 'Metodología para abordar problemas computacionales',
              type: 'video',
              estimatedTime: '30 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-1-2',
              title: 'Diagramas de Flujo - Conceptos Básicos',
              description: 'Aprende a crear diagramas de flujo para representar algoritmos',
              type: 'video',
              estimatedTime: '45 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-1-3',
              title: 'Práctica: Creando tu Primer Diagrama',
              description: 'Ejercicio práctico para crear diagramas de flujo',
              type: 'exercise',
              estimatedTime: '60 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-1-4',
              title: 'Quiz: Diagramas de Flujo',
              description: 'Evaluación de conocimientos sobre diagramas de flujo',
              type: 'quiz',
              estimatedTime: '15 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-2',
          title: 'Instalación del JDK',
          description: 'Configura tu entorno de desarrollo Java en tu sistema operativo',
          estimatedTime: '3 días',
          order: 2,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-2-1',
              title: '¿Qué es el JDK?',
              description: 'Introducción al Java Development Kit',
              type: 'reading',
              estimatedTime: '20 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-2-2',
              title: 'Instalación en Windows',
              description: 'Guía paso a paso para instalar JDK en Windows',
              type: 'video',
              estimatedTime: '25 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-2-3',
              title: 'Instalación en macOS y Linux',
              description: 'Instalación del JDK en sistemas Unix',
              type: 'video',
              estimatedTime: '25 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-2-4',
              title: 'Configuración de Variables de Entorno',
              description: 'Configura JAVA_HOME y PATH correctamente',
              type: 'video',
              estimatedTime: '30 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-2-5',
              title: 'Verificación de la Instalación',
              description: 'Prueba que todo esté instalado correctamente',
              type: 'exercise',
              estimatedTime: '15 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-3',
          title: 'Introducción a Java',
          description: 'Fundamentos del lenguaje Java, POO, tipos de datos y operadores',
          estimatedTime: '2 semanas',
          order: 3,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-3-1',
              title: 'Historia y Características de Java',
              description: 'Conoce los orígenes y ventajas del lenguaje Java',
              type: 'video',
              estimatedTime: '35 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-2',
              title: 'Programación Orientada a Objetos (POO)',
              description: 'Conceptos fundamentales: clases, objetos, herencia, polimorfismo',
              type: 'video',
              estimatedTime: '50 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-3',
              title: 'Tu Primer Programa en Java',
              description: 'Escribe y ejecuta "Hola Mundo" en Java',
              type: 'exercise',
              estimatedTime: '30 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-4',
              title: 'Tipos de Datos Primitivos',
              description: 'int, double, boolean, char y sus características',
              type: 'video',
              estimatedTime: '40 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-5',
              title: 'Variables y Constantes',
              description: 'Declaración, inicialización y uso de variables',
              type: 'video',
              estimatedTime: '35 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-6',
              title: 'Operadores en Java',
              description: 'Aritméticos, lógicos, relacionales y de asignación',
              type: 'video',
              estimatedTime: '45 min',
              order: 6,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-7',
              title: 'Lectura desde Teclado',
              description: 'Uso de Scanner para entrada de datos del usuario',
              type: 'video',
              estimatedTime: '30 min',
              order: 7,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-3-8',
              title: 'Práctica: Calculadora Básica',
              description: 'Proyecto práctico aplicando variables y operadores',
              type: 'project',
              estimatedTime: '90 min',
              order: 8,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-4',
          title: 'Sentencias Condicionales',
          description: 'Controla el flujo de tu programa con if, else y switch',
          estimatedTime: '1.5 semanas',
          order: 4,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-4-1',
              title: 'Introducción a las Estructuras de Control',
              description: 'Importancia de las decisiones en programación',
              type: 'video',
              estimatedTime: '25 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-2',
              title: 'Sentencia IF',
              description: 'Ejecución condicional básica',
              type: 'video',
              estimatedTime: '35 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-3',
              title: 'Sentencia IF-ELSE',
              description: 'Alternativas binarias en tus programas',
              type: 'video',
              estimatedTime: '40 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-4',
              title: 'IF Anidado',
              description: 'Múltiples condiciones y decisiones complejas',
              type: 'video',
              estimatedTime: '45 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-5',
              title: 'Sentencia SWITCH',
              description: 'Alternativa elegante para múltiples opciones',
              type: 'video',
              estimatedTime: '40 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-6',
              title: 'Práctica: Sistema de Calificaciones',
              description: 'Aplicación práctica de todas las estructuras condicionales',
              type: 'exercise',
              estimatedTime: '75 min',
              order: 6,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-4-7',
              title: 'Quiz: Estructuras Condicionales',
              description: 'Evaluación de conocimientos',
              type: 'quiz',
              estimatedTime: '20 min',
              order: 7,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-5',
          title: 'Bucles (Ciclos)',
          description: 'Automatiza tareas repetitivas con while, do-while y for',
          estimatedTime: '2 semanas',
          order: 5,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-5-1',
              title: 'Introducción a los Bucles',
              description: '¿Por qué necesitamos repetir código?',
              type: 'video',
              estimatedTime: '30 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-2',
              title: 'Bucle WHILE',
              description: 'Repetición basada en condiciones',
              type: 'video',
              estimatedTime: '40 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-3',
              title: 'Bucle DO-WHILE',
              description: 'Garantiza al menos una ejecución',
              type: 'video',
              estimatedTime: '35 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-4',
              title: 'Bucle FOR',
              description: 'Repeticiones con contador conocido',
              type: 'video',
              estimatedTime: '45 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-5',
              title: 'Bucles Anidados',
              description: 'Ciclos dentro de ciclos para problemas complejos',
              type: 'video',
              estimatedTime: '50 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-6',
              title: 'Break y Continue',
              description: 'Control fino del flujo en bucles',
              type: 'video',
              estimatedTime: '30 min',
              order: 6,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-7',
              title: 'Práctica: Tabla de Multiplicar',
              description: 'Genera tablas usando diferentes tipos de bucles',
              type: 'exercise',
              estimatedTime: '60 min',
              order: 7,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-5-8',
              title: 'Proyecto: Juego de Adivinanza',
              description: 'Proyecto integrador usando bucles y condicionales',
              type: 'project',
              estimatedTime: '120 min',
              order: 8,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-6',
          title: 'Arreglos (Arrays)',
          description: 'Maneja colecciones de datos con arreglos unidimensionales',
          estimatedTime: '1.5 semanas',
          order: 6,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-6-1',
              title: '¿Qué son los Arreglos?',
              description: 'Introducción a las estructuras de datos',
              type: 'video',
              estimatedTime: '35 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-6-2',
              title: 'Declaración e Inicialización',
              description: 'Cómo crear y usar arreglos en Java',
              type: 'video',
              estimatedTime: '40 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-6-3',
              title: 'Acceso y Modificación de Elementos',
              description: 'Trabajo con índices y elementos del arreglo',
              type: 'video',
              estimatedTime: '35 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-6-4',
              title: 'Recorrido de Arreglos',
              description: 'Usar bucles para procesar todos los elementos',
              type: 'video',
              estimatedTime: '45 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-6-5',
              title: 'Búsqueda en Arreglos',
              description: 'Algoritmos para encontrar elementos específicos',
              type: 'video',
              estimatedTime: '50 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-6-6',
              title: 'Práctica: Promedio de Calificaciones',
              description: 'Calcula estadísticas usando arreglos',
              type: 'exercise',
              estimatedTime: '75 min',
              order: 6,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-7',
          title: 'Matrices (Arreglos Bidimensionales)',
          description: 'Trabaja con datos organizados en filas y columnas',
          estimatedTime: '1.5 semanas',
          order: 7,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-7-1',
              title: 'Introducción a las Matrices',
              description: 'Concepto de arreglos bidimensionales',
              type: 'video',
              estimatedTime: '40 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-7-2',
              title: 'Declaración e Inicialización de Matrices',
              description: 'Crear matrices en Java',
              type: 'video',
              estimatedTime: '45 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-7-3',
              title: 'Recorrido de Matrices',
              description: 'Bucles anidados para procesar matrices',
              type: 'video',
              estimatedTime: '50 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-7-4',
              title: 'Operaciones con Matrices',
              description: 'Suma, multiplicación y transposición',
              type: 'video',
              estimatedTime: '60 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-7-5',
              title: 'Práctica: Juego de Tres en Raya',
              description: 'Implementa el clásico juego usando una matriz',
              type: 'project',
              estimatedTime: '150 min',
              order: 5,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        },
        {
          id: 'module-8',
          title: 'Proyecto Final',
          description: 'Integra todos los conocimientos en un proyecto completo',
          estimatedTime: '1 semana',
          order: 8,
          isCompleted: false,
          lessons: [
            {
              id: 'lesson-8-1',
              title: 'Planificación del Proyecto',
              description: 'Análisis de requerimientos y diseño',
              type: 'reading',
              estimatedTime: '45 min',
              order: 1,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-8-2',
              title: 'Sistema de Gestión de Estudiantes',
              description: 'Desarrolla un programa completo paso a paso',
              type: 'project',
              estimatedTime: '240 min',
              order: 2,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-8-3',
              title: 'Presentación y Evaluación',
              description: 'Presenta tu proyecto y recibe retroalimentación',
              type: 'exercise',
              estimatedTime: '60 min',
              order: 3,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            },
            {
              id: 'lesson-8-4',
              title: 'Quiz Final',
              description: 'Evaluación integral de todo el curso',
              type: 'quiz',
              estimatedTime: '45 min',
              order: 4,
              isCompleted: false,
              totalPoints: 0,
              completedPaths: 0,
              currentStreak: 0,
              totalAchievements: 0,
              weeklyGoal: 0,
              weeklyProgress: 0
            }
          ]
        }
      ]
    },
    {
      id: 'web-development',
      title: 'Desarrollo Web Frontend',
      description: 'HTML, CSS, JavaScript y frameworks modernos como React y Angular',
      difficulty: 'intermediate',
      estimatedTime: '8-10 semanas',
      modules: 12,
      icon: '🌐',
      color: '#3b82f6',
      progress: 25
    },
    {
      id: 'backend-development',
      title: 'Desarrollo Backend',
      description: 'APIs REST, bases de datos, Node.js y arquitectura de servidores',
      difficulty: 'intermediate',
      estimatedTime: '10-12 semanas',
      modules: 15,
      icon: '⚙️',
      color: '#8b5cf6',
      progress: 0
    },
    {
      id: 'mobile-development',
      title: 'Desarrollo Móvil',
      description: 'Crea aplicaciones nativas con React Native y Flutter',
      difficulty: 'advanced',
      estimatedTime: '12-14 semanas',
      modules: 18,
      icon: '📱',
      color: '#f59e0b',
      progress: 0
    },
    {
      id: 'data-science',
      title: 'Ciencia de Datos',
      description: 'Python, análisis de datos, machine learning y visualización',
      difficulty: 'advanced',
      estimatedTime: '14-16 semanas',
      modules: 20,
      icon: '📊',
      color: '#ef4444',
      progress: 0
    },
    {
      id: 'devops',
      title: 'DevOps y Cloud',
      description: 'Docker, Kubernetes, CI/CD y despliegue en AWS/Azure',
      difficulty: 'advanced',
      estimatedTime: '10-12 semanas',
      modules: 14,
      icon: '☁️',
      color: '#06b6d4',
      progress: 0
    },
    {
      id: 'cybersecurity',
      title: 'Ciberseguridad',
      description: 'Seguridad en aplicaciones, pentesting y ethical hacking',
      difficulty: 'advanced',
      estimatedTime: '8-10 semanas',
      modules: 12,
      icon: '🔒',
      color: '#dc2626',
      progress: 0
    },
    {
      id: 'ui-ux-design',
      title: 'Diseño UI/UX',
      description: 'Principios de diseño, Figma, prototipado y experiencia de usuario',
      difficulty: 'intermediate',
      estimatedTime: '6-8 semanas',
      modules: 10,
      icon: '🎨',
      color: '#e11d48',
      progress: 0
    }
  ];

  private mockAchievements: Achievement[] = [
    {
      id: 'first-evaluation',
      title: '¡Primera Evaluación!',
      description: 'Completaste tu primera evaluación diagnóstica',
      icon: '🏆',
      unlockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      points: 100
    },
    {
      id: 'welcome',
      title: 'Bienvenido a Código para Todos',
      description: 'Te registraste exitosamente en nuestra plataforma',
      icon: '🎉',
      unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      points: 50
    },
    {
      id: 'first-lesson',
      title: 'Primera Lección Completada',
      description: 'Completaste tu primera lección de programación',
      icon: '📚',
      unlockedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      points: 75
    }
  ];

  private mockDailyTips: DailyTip[] = [
    {
      id: 'tip-1',
      title: 'Práctica Diaria',
      content: 'La programación se aprende mejor practicando todos los días. ¡Dedica al menos 30 minutos diarios a tu aprendizaje!',
      category: 'learning',
      icon: '💡',
      date: new Date()
    },
    {
      id: 'tip-2',
      title: 'Debuggear es Aprender',
      content: 'No te frustres con los errores. Cada bug que resuelves te hace un mejor programador. ¡Los errores son oportunidades de aprendizaje!',
      category: 'programming',
      icon: '🐛',
      date: new Date()
    },
    {
      id: 'tip-3',
      title: 'Construye Proyectos',
      content: 'La mejor manera de consolidar lo aprendido es construyendo proyectos reales. Empieza pequeño y ve creciendo.',
      category: 'programming',
      icon: '🚀',
      date: new Date()
    },
    {
      id: 'tip-4',
      title: 'Comunidad es Clave',
      content: 'Únete a comunidades de desarrolladores. Compartir conocimiento y hacer preguntas acelera tu aprendizaje.',
      category: 'career',
      icon: '👥',
      date: new Date()
    }
  ];

  /**
   * Gets all available learning paths
   * Future: Will connect to GET /api/learning-paths
   */
  getLearningPaths(): Observable<LearningPath[]> {
    // Future API call:
    // return this.http.get<LearningPath[]>(`${this.apiUrl}/learning-paths`);
    
    return of(this.mockLearningPaths).pipe(
      delay(500) // Simulate network delay
    );
  }

  /**
   * Gets learning paths filtered by difficulty level
   * Future: Will connect to GET /api/learning-paths?difficulty={level}
   */
  getLearningPathsByDifficulty(difficulty: string): Observable<LearningPath[]> {
    const filteredPaths = this.mockLearningPaths.filter(path => path.difficulty === difficulty);
    
    // Future API call:
    // return this.http.get<LearningPath[]>(`${this.apiUrl}/learning-paths`, {
    //   params: { difficulty }
    // });
    
    return of(filteredPaths).pipe(delay(300));
  }

  /**
   * Gets recommended learning paths based on user's evaluation result
   * Future: Will connect to GET /api/learning-paths/recommended?userId={id}
   */
  getRecommendedPaths(evaluationResult?: EvaluationResult): Observable<LearningPath[]> {
    let recommendedPaths = [...this.mockLearningPaths];

    if (evaluationResult) {
      // Filter by user's level and next level
      const userLevel = evaluationResult.level;
      const nextLevel = this.getNextDifficultyLevel(userLevel);
      
      recommendedPaths = this.mockLearningPaths.filter(path => 
        path.difficulty === userLevel || path.difficulty === nextLevel
      );

      // Sort by difficulty (user's level first) and progress
      recommendedPaths.sort((a, b) => {
        if (a.difficulty === userLevel && b.difficulty !== userLevel) return -1;
        if (b.difficulty === userLevel && a.difficulty !== userLevel) return 1;
        return (b.progress || 0) - (a.progress || 0);
      });
    }

    // Future API call:
    // return this.http.get<LearningPath[]>(`${this.apiUrl}/learning-paths/recommended`, {
    //   params: { userId: this.authService.getCurrentUserId() }
    // });
    
    return of(recommendedPaths.slice(0, 3)).pipe(delay(400));
  }

  /**
   * Gets user's recent achievements
   * Future: Will connect to GET /api/users/{userId}/achievements/recent
   */
  getRecentAchievements(limit: number = 5): Observable<Achievement[]> {
    const recentAchievements = [...this.mockAchievements]
      .sort((a, b) => b.unlockedAt.getTime() - a.unlockedAt.getTime())
      .slice(0, limit);

    // Future API call:
    // return this.http.get<Achievement[]>(`${this.apiUrl}/users/${userId}/achievements/recent`, {
    //   params: { limit: limit.toString() }
    // });
    
    return of(recentAchievements).pipe(delay(300));
  }

  /**
   * Gets all user achievements
   * Future: Will connect to GET /api/users/{userId}/achievements
   */
  getAllAchievements(): Observable<Achievement[]> {
    // Future API call:
    // return this.http.get<Achievement[]>(`${this.apiUrl}/users/${userId}/achievements`);
    
    return of(this.mockAchievements).pipe(delay(400));
  }

  /**
   * Gets user statistics and progress
   * Future: Will connect to GET /api/users/{userId}/stats
   */
  getUserStats(): Observable<UserStats> {
    const mockStats: UserStats = {
      totalPoints: 325,
      completedPaths: 1,
      currentStreak: 5,
      totalAchievements: this.mockAchievements.length,
      weeklyGoal: 10, // hours
      weeklyProgress: 7.5 // hours completed this week
    };

    // Future API call:
    // return this.http.get<UserStats>(`${this.apiUrl}/users/${userId}/stats`);
    
    return of(mockStats).pipe(delay(350));
  }

  /**
   * Gets daily tip
   * Future: Will connect to GET /api/tips/daily
   */
  getDailyTip(): Observable<DailyTip> {
    // Get random tip
    const randomIndex = Math.floor(Math.random() * this.mockDailyTips.length);
    const dailyTip = this.mockDailyTips[randomIndex];

    // Future API call:
    // return this.http.get<DailyTip>(`${this.apiUrl}/tips/daily`);
    
    return of(dailyTip).pipe(delay(200));
  }

  /**
   * Updates learning path progress
   * Future: Will connect to PUT /api/users/{userId}/learning-paths/{pathId}/progress
   */
  updatePathProgress(pathId: string, progress: number): Observable<void> {
    // Update mock data
    const pathIndex = this.mockLearningPaths.findIndex(p => p.id === pathId);
    if (pathIndex !== -1) {
      this.mockLearningPaths[pathIndex].progress = progress;
    }

    // Future API call:
    // return this.http.put<void>(`${this.apiUrl}/users/${userId}/learning-paths/${pathId}/progress`, {
    //   progress
    // });
    
    return of(void 0).pipe(delay(250));
  }

  /**
   * Starts a learning path for the user
   * Future: Will connect to POST /api/users/{userId}/learning-paths/{pathId}/enroll
   */
  enrollInPath(pathId: string): Observable<void> {
    // In real implementation, this would enroll the user in the path
    console.log(`User enrolled in path: ${pathId}`);

    // Future API call:
    // return this.http.post<void>(`${this.apiUrl}/users/${userId}/learning-paths/${pathId}/enroll`, {});
    
    return of(void 0).pipe(delay(300));
  }

  /**
   * Helper method to get next difficulty level
   */
  private getNextDifficultyLevel(currentLevel: string): string {
    const levels = { 
      'basic': 'intermediate', 
      'intermediate': 'advanced', 
      'advanced': 'advanced' 
    };
    return levels[currentLevel as keyof typeof levels] || 'basic';
  }

  /**
   * Gets detailed course content for a specific learning path
   * Future: Will connect to GET /api/learning-paths/{pathId}/content
   */
  getCourseContent(pathId: string): Observable<CourseModule[]> {
    const path = this.mockLearningPaths.find(p => p.id === pathId);
    const content = path?.content || [];

    // Future API call:
    // return this.http.get<CourseModule[]>(`${this.apiUrl}/learning-paths/${pathId}/content`);
    
    return of(content).pipe(delay(400));
  }

  /**
   * Gets a specific lesson content
   * Future: Will connect to GET /api/lessons/{lessonId}
   */
  getLessonContent(lessonId: string): Observable<Lesson | null> {
    // Find lesson across all paths and modules
    for (const path of this.mockLearningPaths) {
      if (path.content) {
        for (const module of path.content) {
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            return of(lesson).pipe(delay(200));
          }
        }
      }
    }

    // Future API call:
    // return this.http.get<Lesson>(`${this.apiUrl}/lessons/${lessonId}`);
    
    return of(null).pipe(delay(200));
  }

  /**
   * Marks a lesson as completed
   * Future: Will connect to PUT /api/users/{userId}/lessons/{lessonId}/complete
   */
  completLesson(lessonId: string): Observable<void> {
    // Find and update lesson in mock data
    for (const path of this.mockLearningPaths) {
      if (path.content) {
        for (const module of path.content) {
          const lesson = module.lessons.find(l => l.id === lessonId);
          if (lesson) {
            lesson.isCompleted = true;
            break;
          }
        }
      }
    }

    // Future API call:
    // return this.http.put<void>(`${this.apiUrl}/users/${userId}/lessons/${lessonId}/complete`, {});
    
    return of(void 0).pipe(delay(250));
  }

  /**
   * Gets course progress summary
   * Future: Will connect to GET /api/users/{userId}/courses/{courseId}/progress
   */
  getCourseProgress(pathId: string): Observable<{
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
    currentModule: string;
    nextLesson: Lesson | null;
  }> {
    const path = this.mockLearningPaths.find(p => p.id === pathId);
    
    if (!path?.content) {
      return of({
        totalLessons: 0,
        completedLessons: 0,
        progressPercentage: 0,
        currentModule: '',
        nextLesson: null
      });
    }

    let totalLessons = 0;
    let completedLessons = 0;
    let nextLesson: Lesson | null = null;
    let currentModule = '';

    for (const module of path.content) {
      for (const lesson of module.lessons) {
        totalLessons++;
        if (lesson.isCompleted) {
          completedLessons++;
        } else if (!nextLesson) {
          nextLesson = lesson;
          currentModule = module.title;
        }
      }
    }

    const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Future API call:
    // return this.http.get<CourseProgressSummary>(`${this.apiUrl}/users/${userId}/courses/${pathId}/progress`);
    
    return of({
      totalLessons,
      completedLessons,
      progressPercentage,
      currentModule,
      nextLesson
    }).pipe(delay(300));
  }
  getUserPathProgress(): Observable<{pathId: string, progress: number}[]> {
    const mockProgress = [
      { pathId: 'web-development', progress: 25 },
      { pathId: 'basic-programming', progress: 100 }
    ];

    // Future API call:
    // return this.http.get<{pathId: string, progress: number}[]>(`${this.apiUrl}/users/${userId}/learning-paths/progress`);
    
    return of(mockProgress).pipe(delay(300));
  }
}