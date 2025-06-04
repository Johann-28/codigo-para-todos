export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
}