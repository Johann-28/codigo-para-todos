export interface Question {
  id: number;
  question: string;
  options: string[];
  correct_answer: number;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
}