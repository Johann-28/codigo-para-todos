export interface Lesson {
  id: string;
  title: string;
  description: string;
  type: 'video' | 'reading' | 'exercise' | 'quiz' | 'project';
  estimatedTime: string;
  isCompleted?: boolean;
  isLocked?: boolean;
  order: number;
  content?: {
    videoUrl?: string;
    textContent?: string;
    exerciseData?: any;
    quizData?: any;
  };

  totalPoints: number;
  completedPaths: number;
  currentStreak: number;
  totalAchievements: number;
  weeklyGoal: number;
  weeklyProgress: number;
}