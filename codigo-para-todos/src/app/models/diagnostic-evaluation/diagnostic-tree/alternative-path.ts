export interface AlternativePath {
  question_id: number;
  question_text: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
  topic: string;
  options: string[];
  correct_answer: number;
  condition: 'if_correct' | 'if_incorrect';
  position: { x: number; y: number };
  explanation: string;
  would_lead_to: string; 
}