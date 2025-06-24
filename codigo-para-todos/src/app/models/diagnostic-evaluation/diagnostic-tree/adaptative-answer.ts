export interface AdaptiveAnswer {
  questionId: number;
  selectedOption: number;
  isCorrect: boolean;
  difficulty: string;
  timeSpent: number;
}