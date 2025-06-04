import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map } from 'rxjs/operators';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
}

export interface EvaluationResult {
  level: 'basic' | 'intermediate' | 'advanced';
  score: number;
  topics: { [key: string]: number };
  learningStyle: string;
  recommendations: string[];
}

export interface UserAnswer {
  questionId: number;
  selectedOption: number;
  timeSpent: number;
  difficulty: string;
}

export interface EvaluationSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class DiagnosticEvaluationService {
  // private http = inject(HttpClient); // Temporarily commented out until HttpClient is configured
  private apiUrl = 'http://localhost:8000/api/diagnostic';

  // Session management
  private currentSession$ = new BehaviorSubject<EvaluationSession | null>(null);

  // Mock data for development - will be replaced with API calls
  private mockQuestions: Question[] = [
    {
      id: 1,
      question: 'What is a variable in programming?',
      options: [
        'A value that never changes',
        'A memory space to store data',
        'A mathematical function',
        'A type of loop',
      ],
      correctAnswer: 1,
      difficulty: 'basic',
      topic: 'Variables',
    },
    {
      id: 2,
      question: 'What is the correct syntax to declare a variable in Java?',
      options: [
        'var x = 5;',
        'int x = 5;',
        'variable x = 5;',
        'declare int x = 5;',
      ],
      correctAnswer: 1,
      difficulty: 'basic',
      topic: 'Variables',
    },
    {
      id: 3,
      question: "What is a 'for' loop in programming?",
      options: [
        'A data structure',
        'A control structure that repeats code',
        'A mathematical function',
        'A type of variable',
      ],
      correctAnswer: 1,
      difficulty: 'intermediate',
      topic: 'Loops',
    },
    {
      id: 4,
      question: "What is the difference between '==' and '.equals()' in Java?",
      options: [
        'There is no difference',
        '== compares references, .equals() compares content',
        '== is faster than .equals()',
        '.equals() only works with numbers',
      ],
      correctAnswer: 1,
      difficulty: 'intermediate',
      topic: 'Operators',
    },
    {
      id: 5,
      question: 'What is time complexity O(n²) in algorithms?',
      options: [
        'The algorithm takes constant time',
        'The time grows quadratically with input size',
        'The algorithm is linear',
        'The time cannot be determined',
      ],
      correctAnswer: 1,
      difficulty: 'advanced',
      topic: 'Algorithms',
    },
    {
      id: 6,
      question: 'Which design pattern ensures a class has only one instance?',
      options: ['Factory', 'Observer', 'Singleton', 'Strategy'],
      correctAnswer: 2,
      difficulty: 'advanced',
      topic: 'Design Patterns',
    },
  ];

  constructor() {}

  /**
   * Starts a new evaluation session
   */
  startEvaluationSession(userId: string): Observable<EvaluationSession> {
    const session: EvaluationSession = {
      sessionId: this.generateSessionId(),
      userId,
      startTime: new Date(),
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
    };

    this.currentSession$.next(session);

    // In future, this will call the API
    // return this.http.post<EvaluationSession>(`${this.apiUrl}/start-session`, { userId });
    return of(session).pipe(delay(300));
  }

  /**
   * Gets adaptive questions based on user's previous answers
   */
  getAdaptiveQuestions(session: EvaluationSession): Observable<Question[]> {
    // Future implementation will use AI to select questions based on performance
    // For now, return all questions
    // return this.http.get<Question[]>(`${this.apiUrl}/questions/${session.sessionId}`);

    return of(this.mockQuestions).pipe(delay(500));
  }

  /**
   * Gets initial questions for the evaluation
   */
  getQuestions(): Observable<Question[]> {
    // Future API call
    // return this.http.get<Question[]>(`${this.apiUrl}/questions`);

    // Mock implementation with delay to simulate API call
    return of(this.mockQuestions).pipe(delay(500));
  }

  /**
   * Gets the current session (for component access)
   */
  getCurrentSession(): EvaluationSession | null {
    return this.currentSession$.value;
  }

  /**
   * Submits an answer and gets the next question (adaptive)
   */
  submitAnswer(
    answer: UserAnswer
  ): Observable<{ nextQuestion?: Question; isCompleted: boolean }> {
    const currentSession = this.currentSession$.value;
    if (!currentSession) {
      throw new Error('No active evaluation session');
    }

    // Update session with new answer
    currentSession.answers.push(answer);
    currentSession.currentQuestionIndex++; // Update index to match answers count

    // Check if evaluation should end based on AI logic
    const shouldEnd = this.shouldEndEvaluation(currentSession);

    if (shouldEnd) {
      currentSession.isCompleted = true;
      this.currentSession$.next(currentSession);
      return of({ isCompleted: true });
    }

    // Get next adaptive question
    const nextQuestion = this.getNextAdaptiveQuestion(currentSession);
    this.currentSession$.next(currentSession);

    // Future API call
    // return this.http.post<{nextQuestion?: Question; isCompleted: boolean}>(`${this.apiUrl}/submit-answer`, answer);

    return of({ nextQuestion, isCompleted: false }).pipe(delay(300));
  }

  /**
   * Calculates final evaluation results using AI
   */
  calculateResults(session: EvaluationSession): Observable<EvaluationResult> {
    const answers = session.answers;
    let correctAnswers = 0;
    const topicScores: { [key: string]: { correct: number; total: number } } =
      {};
    const difficultyPerformance: { [key: string]: number } = {
      basic: 0,
      intermediate: 0,
      advanced: 0,
    };

    // Calculate scores
    answers.forEach((answer) => {
      const question = this.mockQuestions.find(
        (q) => q.id === answer.questionId
      );
      if (!question) return;

      const isCorrect = answer.selectedOption === question.correctAnswer;
      if (isCorrect) correctAnswers++;

      // Track topic performance
      if (!topicScores[question.topic]) {
        topicScores[question.topic] = { correct: 0, total: 0 };
      }
      topicScores[question.topic].total++;
      if (isCorrect) topicScores[question.topic].correct++;

      // Track difficulty performance
      difficultyPerformance[question.difficulty] += isCorrect ? 1 : 0;
    });

    const score = Math.round((correctAnswers / answers.length) * 100);

    // Advanced level determination based on difficulty performance
    let level: 'basic' | 'intermediate' | 'advanced' = 'basic';
    if (difficultyPerformance['advanced'] >= 2 && score >= 75) {
      level = 'advanced';
    } else if (difficultyPerformance['intermediate'] >= 2 && score >= 60) {
      level = 'intermediate';
    }

    // Convert topic scores to percentages
    const topics: { [key: string]: number } = {};
    Object.keys(topicScores).forEach((topic) => {
      const { correct, total } = topicScores[topic];
      topics[topic] = Math.round((correct / total) * 100);
    });

    // Determine learning style based on time spent and performance
    const averageTime =
      answers.reduce((sum, a) => sum + a.timeSpent, 0) / answers.length;
    const learningStyle = averageTime > 30000 ? 'Reflective' : 'Practical'; // 30 seconds threshold

    // Generate personalized recommendations
    const recommendations = this.generateRecommendations(
      level,
      topics,
      learningStyle
    );

    const result: EvaluationResult = {
      level,
      score,
      topics,
      learningStyle,
      recommendations,
    };

    // Future API call
    // return this.http.post<EvaluationResult>(`${this.apiUrl}/calculate-results`, { sessionId: session.sessionId });

    return of(result).pipe(delay(1000));
  }

  /**
   * Saves evaluation results to database
   */
  saveResults(
    result: EvaluationResult,
    session: EvaluationSession
  ): Observable<any> {
    const payload = {
      sessionId: session.sessionId,
      userId: session.userId,
      result,
      completedAt: new Date(),
    };

    // Future API call
    // return this.http.post(`${this.apiUrl}/save-results`, payload);

    return of({ success: true, id: session.sessionId }).pipe(delay(500));
  }

  /**
   * Gets user's evaluation history
   */
  getEvaluationHistory(userId: string): Observable<EvaluationResult[]> {
    // Future API call
    // return this.http.get<EvaluationResult[]>(`${this.apiUrl}/history/${userId}`);

    return of([]).pipe(delay(300));
  }

  /**
   * Gets current evaluation session
   */

  // Private helper methods

  private generateSessionId(): string {
    return 'eval_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private shouldEndEvaluation(session: EvaluationSession): boolean {
    const answers = session.answers;

    // Minimum 3 questions, maximum 10
    if (answers.length < 3) return false;
    if (answers.length >= 10) return true;

    // End if we have enough data to determine level confidently
    const recentAnswers = answers.slice(-3);
    const recentCorrect = recentAnswers.filter((a) => {
      const q = this.mockQuestions.find((q) => q.id === a.questionId);
      return q && a.selectedOption === q.correctAnswer;
    }).length;

    // If last 3 answers show consistent performance, we can end
    return recentCorrect === 0 || recentCorrect === 3;
  }

  private getNextAdaptiveQuestion(
    session: EvaluationSession
  ): Question | undefined {
    const answers = session.answers;
    const answeredIds = answers.map((a) => a.questionId);

    // Filter out already answered questions
    const availableQuestions = this.mockQuestions.filter(
      (q) => !answeredIds.includes(q.id)
    );

    if (availableQuestions.length === 0) return undefined;

    // Simple adaptive logic - adjust based on recent performance
    const recentAnswers = answers.slice(-2);
    let targetDifficulty: 'basic' | 'intermediate' | 'advanced' = 'basic';

    if (recentAnswers.length >= 2) {
      const recentCorrect = recentAnswers.filter((a) => {
        const q = this.mockQuestions.find((q) => q.id === a.questionId);
        return q && a.selectedOption === q.correctAnswer;
      }).length;

      if (recentCorrect === 2) {
        // Increase difficulty
        const lastDifficulty = this.mockQuestions.find(
          (q) => q.id === recentAnswers[recentAnswers.length - 1].questionId
        )?.difficulty;
        if (lastDifficulty === 'basic') targetDifficulty = 'intermediate';
        else if (lastDifficulty === 'intermediate')
          targetDifficulty = 'advanced';
        else targetDifficulty = 'advanced';
      } else if (recentCorrect === 0) {
        // Decrease difficulty
        const lastDifficulty = this.mockQuestions.find(
          (q) => q.id === recentAnswers[recentAnswers.length - 1].questionId
        )?.difficulty;
        if (lastDifficulty === 'advanced') targetDifficulty = 'intermediate';
        else if (lastDifficulty === 'intermediate') targetDifficulty = 'basic';
        else targetDifficulty = 'basic';
      }
    }

    // Find question with target difficulty, fallback to any available
    return (
      availableQuestions.find((q) => q.difficulty === targetDifficulty) ||
      availableQuestions[0]
    );
  }

  private generateRecommendations(
    level: string,
    topics: { [key: string]: number },
    learningStyle: string
  ): string[] {
    const recommendations: string[] = [];

    // Level-based recommendations
    switch (level) {
      case 'basic':
        recommendations.push('Start with basic Java syntax exercises');
        recommendations.push('Practice declaring and using variables');
        break;
      case 'intermediate':
        recommendations.push('Focus on control structures and loops');
        recommendations.push('Practice with arrays and methods');
        break;
      case 'advanced':
        recommendations.push('Study design patterns and software architecture');
        recommendations.push('Practice advanced complexity algorithms');
        break;
    }

    // Topic-based recommendations
    Object.entries(topics).forEach(([topic, score]) => {
      if (score < 60) {
        recommendations.push(`Strengthen your knowledge in ${topic}`);
      }
    });

    // Learning style recommendations
    if (learningStyle === 'Reflective') {
      recommendations.push(
        'Spend time reading documentation before practicing'
      );
    } else {
      recommendations.push('You learn better by practicing directly with code');
    }

    return recommendations;
  }
}
