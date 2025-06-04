import { Injectable } from '@angular/core';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { LearningPath } from '../models/home/learning-path.interface';
import { Achievement } from '../models/home/achievement.interface';
import { EvaluationResult } from '../models/diagnostic-evaluation/evaluation-result.interface';
import { DailyTip } from '../models/home/daily-tip.interface';
import { UserStats } from '../models/home/user-stats';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly apiUrl = '/api'; // Future API endpoint base URL

  // Mock data storage (in future, these won't be needed)
  private mockLearningPaths: LearningPath[] = [
    {
      id: 'basic-programming',
      title: 'Programming Fundamentals',
      description: 'Learn the basic programming concepts from scratch with practical exercises',
      difficulty: 'basic',
      estimatedTime: '4-6 weeks',
      modules: 8,
      icon: '🎯',
      color: '#10b981',
      progress: 0
    },
    {
      id: 'web-development',
      title: 'Frontend Web Development',
      description: 'HTML, CSS, JavaScript and modern frameworks like React and Angular',
      difficulty: 'intermediate',
      estimatedTime: '8-10 weeks',
      modules: 12,
      icon: '🌐',
      color: '#3b82f6',
      progress: 25
    },
    {
      id: 'backend-development',
      title: 'Backend Development',
      description: 'REST APIs, databases, Node.js and server architecture',
      difficulty: 'intermediate',
      estimatedTime: '10-12 weeks',
      modules: 15,
      icon: '⚙️',
      color: '#8b5cf6',
      progress: 0
    },
    {
      id: 'mobile-development',
      title: 'Mobile Development',
      description: 'Create native apps with React Native and Flutter',
      difficulty: 'advanced',
      estimatedTime: '12-14 weeks',
      modules: 18,
      icon: '📱',
      color: '#f59e0b',
      progress: 0
    },
    {
      id: 'data-science',
      title: 'Data Science',
      description: 'Python, data analysis, machine learning and visualization',
      difficulty: 'advanced',
      estimatedTime: '14-16 weeks',
      modules: 20,
      icon: '📊',
      color: '#ef4444',
      progress: 0
    },
    {
      id: 'devops',
      title: 'DevOps and Cloud',
      description: 'Docker, Kubernetes, CI/CD and deployment on AWS/Azure',
      difficulty: 'advanced',
      estimatedTime: '10-12 weeks',
      modules: 14,
      icon: '☁️',
      color: '#06b6d4',
      progress: 0
    },
    {
      id: 'cybersecurity',
      title: 'Cybersecurity',
      description: 'Application security, pentesting and ethical hacking',
      difficulty: 'advanced',
      estimatedTime: '8-10 weeks',
      modules: 12,
      icon: '🔒',
      color: '#dc2626',
      progress: 0
    },
    {
      id: 'ui-ux-design',
      title: 'UI/UX Design',
      description: 'Design principles, Figma, prototyping and user experience',
      difficulty: 'intermediate',
      estimatedTime: '6-8 weeks',
      modules: 10,
      icon: '🎨',
      color: '#e11d48',
      progress: 0
    }
  ];

  private mockAchievements: Achievement[] = [
    {
      id: 'first-evaluation',
      title: 'First Evaluation!',
      description: 'You completed your first diagnostic evaluation',
      icon: '🏆',
      unlockedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      points: 100
    },
    {
      id: 'welcome',
      title: 'Welcome to Código para Todos',
      description: 'You successfully registered on our platform',
      icon: '🎉',
      unlockedAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      points: 50
    },
    {
      id: 'first-lesson',
      title: 'First Lesson Completed',
      description: 'You completed your first programming lesson',
      icon: '📚',
      unlockedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      points: 75
    }
  ];

  private mockDailyTips: DailyTip[] = [
    {
      id: 'tip-1',
      title: 'Daily Practice',
      content: 'Programming is best learned by practicing every day. Dedicate at least 30 minutes daily to your learning!',
      category: 'learning',
      icon: '💡',
      date: new Date()
    },
    {
      id: 'tip-2',
      title: 'Debugging is Learning',
      content: 'Don’t get frustrated with errors. Every bug you solve makes you a better programmer. Mistakes are learning opportunities!',
      category: 'programming',
      icon: '🐛',
      date: new Date()
    },
    {
      id: 'tip-3',
      title: 'Build Projects',
      content: 'The best way to consolidate what you’ve learned is by building real projects. Start small and grow.',
      category: 'programming',
      icon: '🚀',
      date: new Date()
    },
    {
      id: 'tip-4',
      title: 'Community is Key',
      content: 'Join developer communities. Sharing knowledge and asking questions accelerates your learning.',
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
   * Gets user's learning path progress
   * Future: Will connect to GET /api/users/{userId}/learning-paths/progress
   */
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
