import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Achievement } from '../models/home/achievement.interface';
import { EvaluationResult } from '../models/diagnostic-evaluation/evaluation-result.interface';
import { Lesson } from '../models/course-content/lesson.interface';
import { UserStats } from '../models/home/user-stats';
import { environment } from '../../../../backend/app/environment/environment';

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

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  currentModule: string;
  nextLesson: Lesson | null;
}

export interface DashboardData {
  userStats: UserStats;
  recentAchievements: Achievement[];
  dailyTip: DailyTip;
  pathProgress: { pathId: string; progress: number }[];
  lastUpdated: string;
}

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private readonly apiUrl = environment.apiUrl;
  private http = inject(HttpClient);
  
  constructor(private httpClient: HttpClient) {
    this.http = httpClient;
  }

  /**
   * Gets all available learning paths
   */
  getLearningPaths(): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(`${this.apiUrl}/learning-paths/`).pipe(
      map((paths: any[]) => paths.map(path => this.mapLearningPathFromBackend(path))),
      catchError((error) => {
        console.error('Error getting learning paths:', error);
        throw error;
      })
    );
  }

  /**
   * Gets learning paths filtered by difficulty level
   */
  getLearningPathsByDifficulty(difficulty: string): Observable<LearningPath[]> {
    return this.http.get<LearningPath[]>(`${this.apiUrl}/learning-paths/by-difficulty?difficulty=${difficulty}`).pipe(
      map((paths: any[]) => paths.map(path => this.mapLearningPathFromBackend(path))),
      catchError((error) => {
        console.error('Error getting learning paths by difficulty:', error);
        throw error;
      })
    );
  }

  /**
   * Gets recommended learning paths based on user's evaluation result
   */
  getRecommendedPaths(userId: string, evaluationResult?: EvaluationResult): Observable<LearningPath[]> {
    let url = `${this.apiUrl}/learning-paths/recommended/${userId}`;
    
    if (evaluationResult?.level) {
      url += `?evaluation_level=${evaluationResult.level}`;
    }

    return this.http.get<LearningPath[]>(url).pipe(
      map((paths: any[]) => paths.map(path => this.mapLearningPathFromBackend(path))),
      catchError((error) => {
        console.error('Error getting recommended paths:', error);
        throw error;
      })
    );
  }

  /**
   * Gets user's recent achievements
   */
  getRecentAchievements(userId: string, limit: number = 5): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/home/achievements/${userId}/recent?limit=${limit}`).pipe(
      map((achievements: any[]) => achievements.map(achievement => this.mapAchievementFromBackend(achievement))),
      catchError((error) => {
        console.error('Error getting recent achievements:', error);
        throw error;
      })
    );
  }

  /**
   * Gets all user achievements
   */
  getAllAchievements(userId: string): Observable<Achievement[]> {
    return this.http.get<Achievement[]>(`${this.apiUrl}/home/achievements/${userId}`).pipe(
      map((achievements: any[]) => achievements.map(achievement => this.mapAchievementFromBackend(achievement))),
      catchError((error) => {
        console.error('Error getting all achievements:', error);
        throw error;
      })
    );
  }

  /**
   * Gets user statistics and progress
   */
  getUserStats(userId: string): Observable<UserStats> {
    return this.http.get<any>(`${this.apiUrl}/home/stats/${userId}`).pipe(
      map((stats: any) => this.mapUserStatsFromBackend(stats)),
      catchError((error) => {
        console.error('Error getting user stats:', error);
        throw error;
      })
    );
  }

  /**
   * Gets daily tip
   */
  getDailyTip(): Observable<DailyTip> {
    return this.http.get<any>(`${this.apiUrl}/home/daily-tip`).pipe(
      map((tip: any) => this.mapDailyTipFromBackend(tip)),
      catchError((error) => {
        console.error('Error getting daily tip:', error);
        throw error;
      })
    );
  }

  /**
   * Gets comprehensive dashboard data
   */
  getDashboardData(userId: string): Observable<DashboardData> {
    return this.http.get<any>(`${this.apiUrl}/home/dashboard/${userId}`).pipe(
      map((data: any) => ({
        userStats: this.mapUserStatsFromBackend(data.user_stats || data.userStats),
        recentAchievements: (data.recent_achievements || data.recentAchievements || [])
          .map((achievement: any) => this.mapAchievementFromBackend(achievement)),
        dailyTip: this.mapDailyTipFromBackend(data.daily_tip || data.dailyTip),
        pathProgress: data.path_progress || data.pathProgress || [],
        lastUpdated: data.last_updated || data.lastUpdated || ''
      })),
      catchError((error) => {
        console.error('Error getting dashboard data:', error);
        throw error;
      })
    );
  }

  /**
   * Updates learning path progress
   */
  updatePathProgress(userId: string, pathId: string, progress: number): Observable<void> {
    const requestData = {
      user_id: userId,
      path_id: pathId,
      progress: progress
    };

    return this.http.put<any>(`${this.apiUrl}/learning-paths/progress`, requestData).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error('Error updating path progress:', error);
        throw error;
      })
    );
  }

  /**
   * Starts a learning path for the user
   */
  enrollInPath(userId: string, pathId: string): Observable<void> {
    const requestData = {
      user_id: userId,
      path_id: pathId
    };

    return this.http.post<any>(`${this.apiUrl}/learning-paths/enroll`, requestData).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error('Error enrolling in path:', error);
        throw error;
      })
    );
  }

  /**
   * Gets detailed course content for a specific learning path
   */
  getCourseContent(pathId: string): Observable<CourseModule[]> {
    return this.http.get<any[]>(`${this.apiUrl}/learning-paths/${pathId}/content`).pipe(
      map((modules: any[]) => modules.map(module => this.mapCourseModuleFromBackend(module))),
      catchError((error) => {
        console.error('Error getting course content:', error);
        throw error;
      })
    );
  }

  /**
   * Gets a specific lesson content
   */
  getLessonContent(lessonId: string): Observable<Lesson | null> {
    return this.http.get<any>(`${this.apiUrl}/learning-paths/lessons/${lessonId}`).pipe(
      map((lesson: any) => lesson ? this.mapLessonFromBackend(lesson) : null),
      catchError((error) => {
        console.error('Error getting lesson content:', error);
        throw error;
      })
    );
  }

  /**
   * Marks a lesson as completed
   */
  completeLesson(userId: string, lessonId: string): Observable<void> {
    const requestData = {
      user_id: userId,
      lesson_id: lessonId
    };

    return this.http.put<any>(`${this.apiUrl}/learning-paths/lessons/complete`, requestData).pipe(
      map(() => void 0),
      catchError((error) => {
        console.error('Error completing lesson:', error);
        throw error;
      })
    );
  }

  /**
   * Gets course progress summary
   */
  getCourseProgress(userId: string, pathId: string): Observable<CourseProgress> {
    return this.http.get<any>(`${this.apiUrl}/learning-paths/${pathId}/progress/${userId}`).pipe(
      map((progress: any) => ({
        totalLessons: progress.total_lessons || progress.totalLessons,
        completedLessons: progress.completed_lessons || progress.completedLessons,
        progressPercentage: progress.progress_percentage || progress.progressPercentage,
        currentModule: progress.current_module || progress.currentModule,
        nextLesson: progress.next_lesson ? this.mapLessonFromBackend(progress.next_lesson) : null
      })),
      catchError((error) => {
        console.error('Error getting course progress:', error);
        throw error;
      })
    );
  }

  /**
   * Gets user's path progress
   */
  getUserPathProgress(userId: string): Observable<{pathId: string, progress: number}[]> {
    return this.http.get<any[]>(`${this.apiUrl}/home/progress/${userId}`).pipe(
      map((progressList: any[]) => progressList.map(item => ({
        pathId: item.path_id || item.pathId,
        progress: item.progress
      }))),
      catchError((error) => {
        console.error('Error getting user path progress:', error);
        throw error;
      })
    );
  }

  // Helper methods to map backend responses to frontend models
  private mapLearningPathFromBackend(path: any): LearningPath {
    return {
      id: path.id,
      title: path.title,
      description: path.description,
      difficulty: path.difficulty,
      estimatedTime: path.estimated_time || path.estimatedTime,
      modules: path.modules,
      icon: path.icon,
      color: path.color,
      progress: path.progress,
      enrolled: path.enrolled,
      lastAccessed: path.last_accessed ? new Date(path.last_accessed) : undefined,
      completedModules: path.completed_modules || path.completedModules,
      prerequisites: path.prerequisites,
      skills: path.skills,
      instructor: path.instructor,
      rating: path.rating,
      isNew: path.is_new || path.isNew,
      isPopular: path.is_popular || path.isPopular,
      category: path.category,
      content: path.content ? path.content.map((module: any) => this.mapCourseModuleFromBackend(module)) : undefined
    };
  }

  private mapCourseModuleFromBackend(module: any): CourseModule {
    return {
      id: module.id,
      title: module.title,
      description: module.description,
      estimatedTime: module.estimated_time || module.estimatedTime,
      isCompleted: module.is_completed || module.isCompleted,
      lessons: module.lessons ? module.lessons.map((lesson: any) => this.mapLessonFromBackend(lesson)) : [],
      order: module.order
    };
  }

  private mapLessonFromBackend(lesson: any): Lesson {
    return {
      id: lesson.id,
      title: lesson.title,
      description: lesson.description,
      type: lesson.type,
      estimatedTime: lesson.estimated_time || lesson.estimatedTime,
      isCompleted: lesson.is_completed || lesson.isCompleted,
      isLocked: lesson.is_locked || lesson.isLocked,
      order: lesson.order,
      content: lesson.content,
      totalPoints: lesson.total_points || lesson.totalPoints || 0,
      completedPaths: lesson.completed_paths || lesson.completedPaths || 0,
      currentStreak: lesson.current_streak || lesson.currentStreak || 0,
      totalAchievements: lesson.total_achievements || lesson.totalAchievements || 0,
      weeklyGoal: lesson.weekly_goal || lesson.weeklyGoal || 0,
      weeklyProgress: lesson.weekly_progress || lesson.weeklyProgress || 0
    };
  }

  private mapAchievementFromBackend(achievement: any): Achievement {
    return {
      id: achievement.id,
      title: achievement.title,
      description: achievement.description,
      icon: achievement.icon,
      unlockedAt: new Date(achievement.unlocked_at || achievement.unlockedAt),
      points: achievement.points
    };
  }

  private mapUserStatsFromBackend(stats: any): UserStats {
    return {
      totalPoints: stats.total_points || stats.totalPoints || 0,
      completedPaths: stats.completed_paths || stats.completedPaths || 0,
      currentStreak: stats.current_streak || stats.currentStreak || 0,
      totalAchievements: stats.total_achievements || stats.totalAchievements || 0,
      weeklyGoal: stats.weekly_goal || stats.weeklyGoal || 0,
      weeklyProgress: stats.weekly_progress || stats.weeklyProgress || 0
    };
  }

  private mapDailyTipFromBackend(tip: any): DailyTip {
    return {
      id: tip.id,
      title: tip.title,
      content: tip.content,
      category: tip.category,
      icon: tip.icon,
      date: new Date(tip.date)
    };
  }
}