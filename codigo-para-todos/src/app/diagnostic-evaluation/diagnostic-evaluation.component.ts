import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { EvaluationResult } from '../models/diagnostic-evaluation';
import { DiagnosticEvaluationService, Question, EvaluationSession, question_id, SubmitAnswerResponse, EvaluationResultResponse } from '../shared/home.service';
import { AnswerReviewItem } from '../models/diagnostic-evaluation/answer-review-item';

@Component({
  selector: 'app-diagnostic-evaluation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './diagnostic-evaluation.component.html',
  styleUrls: ['./diagnostic-evaluation.component.scss']
})
export class DiagnosticEvaluationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private evaluationService = inject(DiagnosticEvaluationService);
  private authService = inject(AuthService);

  // Signals for reactive state management
  questions = signal<Question[]>([]);
  currentQuestion = signal<Question | null>(null);
  selectedAnswer = signal<number | null>(null);
  showResults = signal(false);
  evaluationResult = signal<EvaluationResult | null>(null);
  isLoading = signal(false);
  currentSession = signal<EvaluationSession | null>(null);
  questionStartTime = signal<number>(0);
  error = signal<string | null>(null);
  totalAnswered = signal<number>(0);
  currentReviewIndex : number = 0;

  // Computed values
  hasQuestions = computed(() => this.questions().length > 0);
  canGoNext = computed(() => this.selectedAnswer() !== null);
  progressPercentage = computed(() => {
    const answered = this.totalAnswered();
    const maxQuestions = 6; // Backend uses 6 questions for adaptive evaluation
    return Math.min((answered / maxQuestions) * 100, 100);
  });

  currentUser = computed(() => this.authService.currentUser());

  ngOnInit() {
        this.currentReviewIndex = 0;
    console.log('Diagnostic Evaluation Component initialized');
    this.startEvaluation();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startEvaluation() {
    this.isLoading.set(true);
    this.error.set(null);
    this.totalAnswered.set(0);

    const user = this.currentUser();
    if (!user) {
      this.error.set('Please log in to take the evaluation.');
      this.router.navigate(['/auth/login']);
      return;
    }

    this.evaluationService.startEvaluationSession(user.id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (session) => {
          console.log(session);
          this.currentSession.set(session);
          this.loadInitialQuestions();
        },
        error: (error) => {
          this.error.set('Error starting the evaluation. Please try again.');
          console.error('Error starting evaluation:', error);
        }
      });
  }

  private loadInitialQuestions() {
    this.isLoading.set(true);

    this.evaluationService.getQuestions()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (questions) => {
          this.questions.set(questions);
          if (questions.length > 0) {
            this.currentQuestion.set(questions[0]);
            this.questionStartTime.set(Date.now());
          }
        },
        error: (error) => {
          this.error.set('Error loading questions. Please try again.');
          console.error('Error loading questions:', error);
        }
      });
  }

  selectAnswer(optionIndex: number) {
    this.selectedAnswer.set(optionIndex);
  }


  nextQuestion() {
    const session = this.currentSession();
    const currentQ = this.currentQuestion();
    const selected = this.selectedAnswer();

    if (!session || !currentQ || selected === null) {
      console.warn('Missing required data for submitting answer');
      return;
    }

    this.isLoading.set(true);

    // Prepare answer data
    const answer: question_id = {
      question_id: currentQ.id,
      selected_option: selected,
      time_spent: Date.now() - this.questionStartTime(),
      difficulty: currentQ.difficulty
    };


    this.evaluationService.submitAnswer(session.session_id, answer)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: SubmitAnswerResponse) => {
          console.log('Answer submitted, response:', response);
          
          // Increment answered count
          this.totalAnswered.set(this.totalAnswered() + 1);

          if (response.isCompleted) {
            console.log('Evaluation completed, calculating results...');
            this.calculateFinalResults();
          } else if (response.nextQuestion) {
            console.log('Moving to next question:', response.nextQuestion);
            this.currentQuestion.set(response.nextQuestion);
            this.selectedAnswer.set(null);
            this.questionStartTime.set(Date.now());
          } else {
            // Load adaptive questions for next round
            this.loadAdaptiveQuestions();
          }
        },
        error: (error) => {
          this.error.set('Error processing the answer. Please try again.');
          console.error('Error submitting answer:', error);
        }
      });
  }

  private loadAdaptiveQuestions() {
    const session = this.currentSession();
    if (!session) return;

    this.isLoading.set(true);

    this.evaluationService.getAdaptiveQuestions(session.session_id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (questions) => {
          console.log('Adaptive questions loaded:', questions);
          if (questions.length > 0) {
            this.currentQuestion.set(questions[0]);
            this.selectedAnswer.set(null);
            this.questionStartTime.set(Date.now());
          } else {
            // No more questions available, calculate results
            this.calculateFinalResults();
          }
        },
        error: (error) => {
          this.error.set('Error loading next questions. Please try again.');
          console.error('Error loading adaptive questions:', error);
        }
      });
  }

  private calculateFinalResults() {
    const session = this.currentSession();
    if (!session) {
      this.error.set('Session not found. Please restart the evaluation.');
      return;
    }

    this.isLoading.set(true);

    this.evaluationService.calculateResults(session.session_id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response: EvaluationResultResponse) => {
          console.log('Results calculated:', response);
          this.evaluationResult.set(response.result);
          this.currentSession.set(response.session);
          this.showResults.set(true);
          this.saveResults();
        },
        error: (error) => {
          this.error.set('Error calculating results. Please try again.');
          console.error('Error calculating results:', error);
        }
      });
  }

  private saveResults() {
    const session = this.currentSession();
    if (!session) return;

    this.evaluationService.saveResults(session.session_id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('Results saved successfully:', response);
          // Store result in localStorage as backup for navigation
          const result = this.evaluationResult();
          if (result) {
            localStorage.setItem('lastEvaluationResult', JSON.stringify(result));
          }
        },
        error: (error) => {
          console.error('Error saving results:', error);
          // Don't show error to user as this is background operation
        }
      });
  }

  retryEvaluation() {
    this.error.set(null);
    this.showResults.set(false);
    this.selectedAnswer.set(null);
    this.currentSession.set(null);
    this.evaluationResult.set(null);
    this.totalAnswered.set(0);
    this.evaluationService.clearCurrentSession();
    this.startEvaluation();
  }

  goToHome() {
    const result = this.evaluationResult();
    if (result) {
      // Save to localStorage with timestamp for home component
      const resultWithMeta = {
        ...result,
        completedAt: new Date().toISOString(),
        fromDiagnostic: true
      };
      localStorage.setItem('evaluationResult', JSON.stringify(resultWithMeta));
    }

    this.router.navigate(['/home']);
  }

  viewHistory() {
    const user = this.currentUser();
    if (!user) return;

    this.evaluationService.getEvaluationHistory(user.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          console.log('Evaluation history:', history);
          // You could navigate to a history page or show a modal
          // For now, just log it
        },
        error: (error) => {
          console.error('Error loading history:', error);
        }
      });
  }

  // Helper methods for UI
  getLevelText(level: string): string {
    const levelTexts = {
      'basic': 'Básico',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    };
    return levelTexts[level as keyof typeof levelTexts] || 'Básico';
  }

  getLevelClass(level: string): string {
    return level || 'basic';
  }

  getTopicEntries() {
    const topics = this.evaluationResult()?.topics || {};
    return Object.entries(topics).map(([key, value]) => ({ 
      key: this.formatTopicName(key), 
      value: Math.round(value * 100) 
    }));
  }

  private formatTopicName(topic: string): string {
    const topicNames = {
      'variables': 'Variables',
      'functions': 'Funciones',
      'loops': 'Bucles',
      'conditionals': 'Condicionales',
      'arrays': 'Arrays',
      'objects': 'Objetos',
      'algorithms': 'Algoritmos',
      'dataStructures': 'Estructuras de Datos'
    };
    return topicNames[topic as keyof typeof topicNames] || topic;
  }

  getDifficultyText(difficulty: string | undefined): string {
    const difficultyTexts = {
      'basic': 'Básico',
      'intermediate': 'Intermedio',
      'advanced': 'Avanzado'
    };
    return difficultyTexts[difficulty as keyof typeof difficultyTexts] || 'Básico';
  }

  getDifficultyClass(difficulty: string | undefined): string {
    return `difficulty-${difficulty || 'basic'}`;
  }

  getScoreClass(score: number): string {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-needs-improvement';
  }

  getScoreText(score: number): string {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Bien';
    if (score >= 40) return 'Regular';
    return 'Necesita mejorar';
  }

  getAnswerReview(): AnswerReviewItem[] {
  const session = this.currentSession();
  const questions = this.questions();
  
  if (!session?.answers || !questions.length) {
    return [];
  }

  console.log(session);
  const reviewItems = session.answers.map(answer => {
    const question = questions.find(q => q.id === answer.question_id);
    if (!question) {
      return null;
    }
    console.log('Selected option: ', answer.selected_option);
    console.log('Correct answer: ', question.correct_answer);
    console.log('Question: ', question);
    const isCorrect = answer.selected_option === question.correct_answer;

    return {
      question,
      selectedAnswer: answer.selected_option,
      isCorrect,
      timeTaken: answer.time_spent
    };
  }).filter(item => item !== null) as AnswerReviewItem[];

  console.log('Answer review items:', reviewItems);
  return reviewItems;


}

getOptionLetter(index: number): string {
  return String.fromCharCode(65 + index); // A, B, C, D
}

 goToReviewSlide(index: number): void {
    this.currentReviewIndex = index;
  }

    nextReviewQuestion(): void {
    if (this.currentReviewIndex < this.getAnswerReview().length - 1) {
      this.currentReviewIndex++;
    }
  }

   previousReviewQuestion(): void {
    if (this.currentReviewIndex > 0) {
      this.currentReviewIndex--;
    }
  }


}