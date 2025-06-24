export interface EvaluationResult {
  level: 'basic' | 'intermediate' | 'advanced';
  score: number;
  topics: { [key: string]: number };
  learning_style: string;
  recommendations: string[];

}