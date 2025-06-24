import { AlternativePath } from "./alternative-path";
import { DiagnosticTreeNode } from "./diagnostic-tree-node";

export interface TreeConnection {
  from: DiagnosticTreeNode;
  to: DiagnosticTreeNode | AlternativePath;
  type: 'taken' | 'alternative';
  isCorrectPath: boolean;
}