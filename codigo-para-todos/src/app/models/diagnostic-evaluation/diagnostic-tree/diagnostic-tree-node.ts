import { AdaptiveAnswer } from "./adaptative-answer";
import { AlternativePath } from "./alternative-path";



export interface DiagnosticTreeNode {
  id: string;
  questionId: number;
  questionText: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  timeTaken: number;
  position: { x: number; y: number };
  children: DiagnosticTreeNode[];
  alternativePaths: AlternativePath[];
  previousAnswers?: AdaptiveAnswer[];
  level?: 'basic' | 'intermediate' | 'advanced';
}