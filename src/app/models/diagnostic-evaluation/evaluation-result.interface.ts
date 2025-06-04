export interface EvaluationResult {
  level: 'basic' | 'intermediate' | 'advanced';
  score: number;
  topics: { [key: string]: number };
  learningStyle: string;
  recommendations: string[];

}