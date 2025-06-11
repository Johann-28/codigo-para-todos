import { Component, OnInit, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil, forkJoin } from 'rxjs';
import { EvaluationResult } from '../models/diagnostic-evaluation/evaluation-result.interface';
import { Achievement } from '../models/home/achievement.interface';
import { DailyTip } from '../models/home/daily-tip.interface';
import { LearningPath } from '../models/home/learning-path.interface';
import { UserStats } from '../models/home/user-stats';
import { HomeService } from '../shared/home.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private router = inject(Router);
  private homeService = inject(HomeService);

  // Signals for reactive state management
  evaluationResult = signal<EvaluationResult | null>(null);
  learningPaths = signal<LearningPath[]>([]);
  recommendedPaths = signal<LearningPath[]>([]);
  recentAchievements = signal<Achievement[]>([]);
  userStats = signal<UserStats | null>(null);
  dailyTip = signal<DailyTip | null>(null);
  isLoading = signal(false);
  userName = signal('User'); // In real app, get from auth service

  // Computed values
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  hasInProgressPaths = computed(() => {
    return this.learningPaths().some(path => path.progress && path.progress > 0);
  });

  totalProgress = computed(() => {
    const paths = this.learningPaths();
    if (paths.length === 0) return 0;
    
    const totalProgress = paths.reduce((sum, path) => sum + (path.progress || 0), 0);
    return Math.round(totalProgress / paths.length);
  });

  ngOnInit() {
    this.loadEvaluationResult();
    this.loadDashboardData();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadEvaluationResult() {
    // Try to get result from localStorage (backup from diagnostic evaluation)
    const storedResult = localStorage.getItem('evaluationResult');
    if (storedResult) {
      try {
        const result = JSON.parse(storedResult);
        this.evaluationResult.set(result);
      } catch (error) {
        console.error('Error parsing evaluation result:', error);
      }
    }
  }

  private loadDashboardData() {
    this.isLoading.set(true);

    // Load all data in parallel using forkJoin
    const evaluationResult = this.evaluationResult();
    const evaluationResultOrUndefined = evaluationResult === null ? undefined : evaluationResult;
    
    forkJoin({
      learningPaths: this.homeService.getLearningPaths(),
      recommendedPaths: this.homeService.getRecommendedPaths(evaluationResultOrUndefined),
      recentAchievements: this.homeService.getRecentAchievements(3),
      userStats: this.homeService.getUserStats(),
      dailyTip: this.homeService.getDailyTip()
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.learningPaths.set(data.learningPaths);
        this.recommendedPaths.set(data.recommendedPaths);
        this.recentAchievements.set(data.recentAchievements);
        this.userStats.set(data.userStats);
        this.dailyTip.set(data.dailyTip);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('Error loading dashboard data:', error);
        this.isLoading.set(false);
      }
    });
  }

  startPath(pathId: string) {
    // Enroll user in path first, then navigate
    this.homeService.enrollInPath(pathId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Navigate to learning path
          this.router.navigate(['/courses', pathId]);
        },
        error: (error) => {
          console.error('Error enrolling in path:', error);
          // Still navigate even if enrollment fails (for demo purposes)
          this.router.navigate(['/courses', pathId]);
        }
      });
  }

  continueLearning() {
    // Find the path with highest progress or navigate to first recommended
    const pathsWithProgress = this.learningPaths().filter(p => p.progress && p.progress > 0);
    
    if (pathsWithProgress.length > 0) {
      // Sort by progress descending to get the most recent
      const mostRecentPath = pathsWithProgress.sort((a, b) => (b.progress || 0) - (a.progress || 0))[0];
      this.startPath(mostRecentPath.id);
    } else {
      const recommended = this.recommendedPaths();
      if (recommended.length > 0) {
        this.startPath(recommended[0].id);
      }
    }
  }

  retakeEvaluation() {
    this.router.navigate(['/diagnostic-evaluation']);
  }

  viewProfile() {
    this.router.navigate(['/profile']);
  }

  viewAllAchievements() {
    this.router.navigate(['/achievements']);
  }

  viewAllPaths() {
    this.router.navigate(['/learning-paths']);
  }

  refreshDashboard() {
    this.loadDashboardData();
  }

  getDifficultyText(difficulty: string): string {
    const texts = {
      'basic': 'Beginner',
      'intermediate': 'Intermediate',
      'advanced': 'Advanced'
    };
    return texts[difficulty as keyof typeof texts] || 'Beginner';
  }

  getDifficultyColor(difficulty: string): string {
    const colors = {
      'basic': '#10b981',
      'intermediate': '#f59e0b', 
      'advanced': '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#10b981';
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getProgressText(progress: number): string {
    if (progress === 0) return 'Not started';
    if (progress < 25) return 'Just started';
    if (progress < 50) return 'In progress';
    if (progress < 75) return 'Making good progress';
    if (progress < 100) return 'Almost finished';
    return 'Completed';
  }

  getStreakText(streak: number): string {
    if (streak === 0) return 'No streak';
    if (streak === 1) return '1 day in a row';
    return `${streak} days in a row`;
  }
}