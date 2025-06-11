import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

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

export interface SubmitAnswerResponse {
  success: boolean;
  message?: string;
  nextQuestion?: Question;
  isCompleted: boolean;
  timestamp?: Date;
}

export interface EvaluationResultResponse {
  success: boolean;
  message?: string;
  result: EvaluationResult;
  session: EvaluationSession;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class DiagnosticEvaluationService {
  private http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/diagnostic`;

  // Session management
  private currentSession$ = new BehaviorSubject<EvaluationSession | null>(null);

  constructor() {}

  /**
   * Starts a new evaluation session
   */
  startEvaluationSession(userId: string): Observable<EvaluationSession> {
    const requestData = { user_id: userId };
    
    return this.http.post<EvaluationSession>(`${this.apiUrl}/start-session`, requestData).pipe(
      map((session: EvaluationSession) => {
        this.currentSession$.next(session);
        return session;
      }),
      catchError((error) => {
        console.error('Error starting evaluation session:', error);
        throw error;
      })
    );
  }

  /**
   * Gets adaptive questions based on user's previous answers
   */
  getAdaptiveQuestions(sessionId: string): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions/${sessionId}/adaptive`).pipe(
      catchError((error) => {
        console.error('Error getting adaptive questions:', error);
        throw error;
      })
    );
  }

  /**
   * Gets initial questions for the evaluation
   */
  getQuestions(): Observable<Question[]> {
    return this.http.get<Question[]>(`${this.apiUrl}/questions`).pipe(
      catchError((error) => {
        console.error('Error getting questions:', error);
        throw error;
      })
    );
  }

  /**
   * Gets the current session (for component access)
   */
  getCurrentSession(): Observable<EvaluationSession | null> {
    return this.currentSession$.asObservable();
  }

  /**
   * Gets session by ID
   */
  getSession(sessionId: string): Observable<EvaluationSession> {
    return this.http.get<EvaluationSession>(`${this.apiUrl}/session/${sessionId}`).pipe(
      map((session: EvaluationSession) => {
        this.currentSession$.next(session);
        return session;
      }),
      catchError((error) => {
        console.error('Error getting session:', error);
        throw error;
      })
    );
  }

  /**
   * Submits an answer and gets the next question (adaptive)
   */
  submitAnswer(sessionId: string, answer: UserAnswer): Observable<SubmitAnswerResponse> {
    const requestData = {
      session_id: sessionId,
      answer: {
        question_id: answer.questionId,
        selected_option: answer.selectedOption,
        time_spent: answer.timeSpent,
        difficulty: answer.difficulty
      }
    };

    return this.http.post<SubmitAnswerResponse>(`${this.apiUrl}/submit-answer`, requestData).pipe(
      map((response: SubmitAnswerResponse) => {
        // Update current session if needed
        if (response.isCompleted) {
          const currentSession = this.currentSession$.value;
          if (currentSession) {
            currentSession.isCompleted = true;
            this.currentSession$.next(currentSession);
          }
        }
        return response;
      }),
      catchError((error) => {
        console.error('Error submitting answer:', error);
        throw error;
      })
    );
  }

  /**
   * Calculates final evaluation results using AI
   */
  calculateResults(sessionId: string): Observable<EvaluationResultResponse> {
    return this.http.post<EvaluationResultResponse>(`${this.apiUrl}/calculate-results/${sessionId}`, {}).pipe(
      catchError((error) => {
        console.error('Error calculating results:', error);
        throw error;
      })
    );
  }

  /**
   * Saves evaluation results to database
   */
  saveResults(sessionId: string): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/save-results/${sessionId}`, {}).pipe(
      catchError((error) => {
        console.error('Error saving results:', error);
        throw error;
      })
    );
  }

  /**
   * Gets user's evaluation history
   */
  getEvaluationHistory(userId: string): Observable<EvaluationResult[]> {
    return this.http.get<EvaluationResult[]>(`${this.apiUrl}/history/${userId}`).pipe(
      catchError((error) => {
        console.error('Error getting evaluation history:', error);
        throw error;
      })
    );
  }

  /**
   * Clears current session
   */
  clearCurrentSession(): void {
    this.currentSession$.next(null);
  }

  /**
   * Helper method to map backend response to frontend format
   */
  private mapAnswerToBackendFormat(answer: UserAnswer) {
    return {
      question_id: answer.questionId,
      selected_option: answer.selectedOption,
      time_spent: answer.timeSpent,
      difficulty: answer.difficulty
    };
  }

  /**
   * Helper method to map backend session to frontend format
   */
  private mapSessionFromBackend(session: any): EvaluationSession {
    return {
      sessionId: session.session_id || session.sessionId,
      userId: session.user_id || session.userId,
      startTime: new Date(session.start_time || session.startTime),
      currentQuestionIndex: session.current_question_index || session.currentQuestionIndex,
      answers: session.answers || [],
      isCompleted: session.is_completed || session.isCompleted
    };
  }
}