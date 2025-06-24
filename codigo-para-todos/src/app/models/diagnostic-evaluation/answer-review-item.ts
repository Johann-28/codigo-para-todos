import { Question } from "./question.interface";

export interface AnswerReviewItem {
  question: Question;
  selectedAnswer: number;
  isCorrect: boolean;
  timeTaken?: number;
}
