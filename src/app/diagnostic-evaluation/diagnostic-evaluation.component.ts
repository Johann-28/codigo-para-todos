import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DiagnosticEvaluationService, Question, EvaluationResult, EvaluationSession, UserAnswer } from '../shared/diagnostic-evaluation.service';
import { Subject, takeUntil, finalize } from 'rxjs';

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

  // Computed values
  hasQuestions = computed(() => this.questions().length > 0);
  canGoNext = computed(() => this.selectedAnswer() !== null);
  progressPercentage = computed(() => {
    const session = this.currentSession();
    if (!session) return 0;
    const maxQuestions = 6;
    return Math.min((session.currentQuestionIndex / maxQuestions) * 100, 100);
  });

  ngOnInit() {
    console.log('Component initialized');
    this.startEvaluation();
  }

  constructor(private evaluationService: DiagnosticEvaluationService) {
    // Initialize any additional services or state here if needed
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startEvaluation() {
    this.isLoading.set(true);
    this.error.set(null);

    // For now using a mock user ID - in real app this would come from auth service
    const userId = 'user_' + Math.random().toString(36).substr(2, 9);

    this.evaluationService.startEvaluationSession(userId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (session) => {
          this.currentSession.set(session);
          this.loadQuestions();
        },
        error: (error) => {
          this.error.set('Error starting the evaluation. Please try again.');
          console.error('Error starting evaluation:', error);
        }
      });
  }

  private loadQuestions() {
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

    if (!session || !currentQ || selected === null) return;

    this.isLoading.set(true);

    // Prepare answer data
    const answer: UserAnswer = {
      questionId: currentQ.id,
      selectedOption: selected,
      timeSpent: Date.now() - this.questionStartTime(),
      difficulty: currentQ.difficulty
    };

    this.evaluationService.submitAnswer(answer)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (response) => {
          if (response.isCompleted) {
            this.calculateFinalResults();
          } else if (response.nextQuestion) {
            this.currentQuestion.set(response.nextQuestion);
            this.selectedAnswer.set(null);
            this.questionStartTime.set(Date.now());
          }
        },
        error: (error) => {
          this.error.set('Error processing the answer. Please try again.');
          console.error('Error submitting answer:', error);
        }
      });
  }

  private calculateFinalResults() {
    const session = this.currentSession();
    if (!session) return;

    this.isLoading.set(true);

    this.evaluationService.calculateResults(session)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading.set(false))
      )
      .subscribe({
        next: (result) => {
          this.evaluationResult.set(result);
          this.showResults.set(true);
          this.saveResults(result, session);
        },
        error: (error) => {
          this.error.set('Error calculating results. Please try again.');
          console.error('Error calculating results:', error);
        }
      });
  }

  private saveResults(result: EvaluationResult, session: EvaluationSession) {
    this.evaluationService.saveResults(result, session)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Results saved successfully
          console.log('Results saved successfully');
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
    this.startEvaluation();
  }

  getLevelText(level: string): string {
    const levelTexts = {
      'basic': 'Basic Level',
      'intermediate': 'Intermediate Level',
      'advanced': 'Advanced Level'
    };
    return levelTexts[level as keyof typeof levelTexts] || 'Basic Level';
  }

  getLevelClass(level: string): string {
    return level || 'basic';
  }

  getTopicEntries() {
    const topics = this.evaluationResult()?.topics || {};
    return Object.entries(topics).map(([key, value]) => ({ key, value }));
  }

  getDifficultyText(difficulty: string | undefined): string {
    const difficultyTexts = {
      'basic': 'Basic',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return difficultyTexts[difficulty as keyof typeof difficultyTexts] || 'Basic';
  }

  goToHome() {
    const result = this.evaluationResult();
    if (result) {
      // Save to localStorage as backup
      localStorage.setItem('evaluationResult', JSON.stringify(result));
    }

    this.router.navigate(['/home']);
  }
}
