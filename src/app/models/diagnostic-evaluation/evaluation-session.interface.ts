import { UserAnswer } from "./user-answer.interface.js";

export interface EvaluationSession {
  sessionId: string;
  userId: string;
  startTime: Date;
  currentQuestionIndex: number;
  answers: UserAnswer[];
  isCompleted: boolean;
}