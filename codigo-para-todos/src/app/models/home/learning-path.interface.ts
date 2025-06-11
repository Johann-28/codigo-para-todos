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
}
