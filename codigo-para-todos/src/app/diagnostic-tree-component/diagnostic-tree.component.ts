import { Component, Input, OnInit, ElementRef, ViewChild, AfterViewInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnswerReviewItem } from '../models/diagnostic-evaluation/answer-review-item';
import { DiagnosticEvaluationService } from '../shared/home.service';
import { forkJoin, of } from 'rxjs';
import { AdaptiveAnswer } from '../models/diagnostic-evaluation/diagnostic-tree/adaptative-answer';
import { AlternativePath } from '../models/diagnostic-evaluation/diagnostic-tree/alternative-path';
import { DiagnosticTreeNode } from '../models/diagnostic-evaluation/diagnostic-tree/diagnostic-tree-node';
import { TreeConnection } from '../models/diagnostic-evaluation/diagnostic-tree/tree-connection';

@Component({
  selector: 'app-diagnostic-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './diagnostic-tree.component.html',
  styleUrls: ['./diagnostic-tree.component.scss']
})
export class DiagnosticTreeComponent implements OnInit, AfterViewInit {
  @Input() answerReview: AnswerReviewItem[] = [];
  @ViewChild('treeCanvas', { static: true }) canvasRef!: ElementRef<HTMLCanvasElement>;
  
  private canvas!: HTMLCanvasElement;
  private ctx!: CanvasRenderingContext2D;
  
  treeNodes: DiagnosticTreeNode[] = [];
  connections: TreeConnection[] = [];
  selectedNode: DiagnosticTreeNode | null = null;
  selectedAlternative: AlternativePath | null = null;
  hoveredNode: DiagnosticTreeNode | null = null;
  hoveredAlternative: AlternativePath | null = null;
  
  // Loading state
  isLoadingAlternatives = signal(false);
  
  // Configuración del árbol
  private readonly NODE_RADIUS = 30;
  private readonly LEVEL_HEIGHT = 120;
  private readonly NODE_SPACING = 180;
  private readonly CANVAS_PADDING = 60;
  

  private readonly DIFFICULTY_LEVELS = {
    'advanced': 1,
    'intermediate': 2, 
    'basic': 3
  };

  constructor(private evaluationService: DiagnosticEvaluationService) {}

  ngOnInit() {
    this.buildTreeFromAnswers();
  }

ngAfterViewInit() {
  this.canvas = this.canvasRef.nativeElement;
  this.ctx = this.canvas.getContext('2d')!;
  this.setupCanvasEvents();


}

private setupCanvasContext() {
  if (!this.canvas || !this.ctx) {
    this.canvas = this.canvasRef.nativeElement;
    this.ctx = this.canvas.getContext('2d')!;
    }
    
    // High quality rendering configurations
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

    private initializeCanvasSize() {
    this.setupCanvasContext();
    
    if (this.treeNodes.length === 0) {
      console.warn('No nodes to calculate canvas size');
      return;
    }
    
    // Calculate dimensions based on existing nodes
    const maxX = Math.max(
      ...this.treeNodes.map(node => node.position.x),
      ...this.treeNodes.flatMap(node => 
      node.alternativePaths.map(alt => alt.position.x)
      )
    );
    
    const width = Math.max(1200, maxX + this.NODE_SPACING + this.CANVAS_PADDING);
    const height = 500;
    
    // Set canvas dimensions for high resolution
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;
    
    // Scale context for high resolution
    this.ctx.scale(dpr, dpr);
    
    console.log(`Canvas initialized: ${width}x${height}px for ${this.treeNodes.length} nodes`);
    }

    private buildNodesWithAlternatives(alternativesArray: AlternativePath[][]) {
    let xPosition = this.CANVAS_PADDING + this.NODE_RADIUS;
    this.treeNodes = []; // Clear array

    this.answerReview.forEach((answer, index) => {
    const alternatives = alternativesArray[index] || [];
    
    const node: DiagnosticTreeNode = {
      id: `q${index + 1}`,
      questionId: answer.question.id,
      questionText: answer.question.question,
      difficulty: answer.question.difficulty,
      topic: answer.question.topic,
      userAnswer: answer.selectedAnswer,
      correctAnswer: answer.question.correct_answer,
      isCorrect: answer.isCorrect,
      timeTaken: answer.timeTaken || 0,
      position: {
      x: xPosition,
      y: this.getYPositionForDifficulty(answer.question.difficulty)
      },
      children: [],
      alternativePaths: this.positionAlternatives(alternatives, xPosition),
      previousAnswers: this.answerReview.slice(0, index).map(prevAnswer => ({
      questionId: prevAnswer.question.id,
      selectedOption: prevAnswer.selectedAnswer,
      isCorrect: prevAnswer.isCorrect,
      difficulty: prevAnswer.question.difficulty,
      timeSpent: prevAnswer.timeTaken || 0
      }))
    };

    this.treeNodes.push(node);
    xPosition += this.NODE_SPACING;
    });

    console.log(`Built ${this.treeNodes.length} nodes from ${this.answerReview.length} answers`);
    
    // HERE is where we initialize the canvas with the correct size
    this.initializeCanvasSize();
  }

  private buildNodesWithoutAlternatives() {
    let xPosition = this.CANVAS_PADDING + this.NODE_RADIUS;
    this.treeNodes = []; // Clear array

    this.answerReview.forEach((answer, index) => {
    const node: DiagnosticTreeNode = {
      id: `q${index + 1}`,
      questionId: answer.question.id,
      questionText: answer.question.question,
      difficulty: answer.question.difficulty,
      topic: answer.question.topic,
      userAnswer: answer.selectedAnswer,
      correctAnswer: answer.question.correct_answer,
      isCorrect: answer.isCorrect,
      timeTaken: answer.timeTaken || 0,
      position: {
      x: xPosition,
      y: this.getYPositionForDifficulty(answer.question.difficulty)
      },
      children: [],
      alternativePaths: this.generateFallbackAlternatives(answer, xPosition)
    };

    this.treeNodes.push(node);
    xPosition += this.NODE_SPACING;
    });

    console.log(`Built ${this.treeNodes.length} nodes (fallback) from ${this.answerReview.length} answers`);
    
    // HERE we also initialize the canvas
    this.initializeCanvasSize();
    this.generateConnections();
    this.drawTree();
  }

  private buildTreeFromAnswers() {
    if (!this.answerReview.length) {
    console.warn('No answers to build the tree');
    return;
    }

    console.log(`Starting tree construction with ${this.answerReview.length} answers`);
    
    this.isLoadingAlternatives.set(true);
    this.treeNodes = [];
    
    // Build answer history for adaptive context
    const adaptiveAnswers: AdaptiveAnswer[] = [];
    
    // Create requests to get alternatives for each question
    const alternativeRequests = this.answerReview.map((answer, index) => {
    const currentAnswers = adaptiveAnswers.slice(); // Copy up to current point
    
    // Add current answer to context
    const currentAdaptiveAnswer: AdaptiveAnswer = {
      questionId: answer.question.id,
      selectedOption: answer.selectedAnswer,
      isCorrect: answer.isCorrect,
      difficulty: answer.question.difficulty,
      timeSpent: answer.timeTaken || 0
    };
    
    adaptiveAnswers.push(currentAdaptiveAnswer);
    
    return this.evaluationService.getAlternativePathInfo(currentAnswers, answer.question.id);
    });

    // Execute all requests in parallel
    forkJoin(alternativeRequests).subscribe({
    next: (alternativesArray) => {
      this.buildNodesWithAlternatives(alternativesArray);
      this.generateConnections();
      this.drawTree();
      console.log('Tree built successfully:', this.treeNodes);
      console.log('Connections:', this.connections);
      this.isLoadingAlternatives.set(false);
    },
    error: (error) => {
      console.error('Error loading alternatives:', error);
      this.buildNodesWithoutAlternatives(); // Fallback
      console.log('Tree built with fallback:', this.treeNodes);
      console.log('Connections:', this.connections);
      this.isLoadingAlternatives.set(false);
    }
    });
  }


private initializeCanvas() {
  this.canvas = this.canvasRef.nativeElement;
  this.ctx = this.canvas.getContext('2d')!;
  
  // Calculate canvas dimensions based on tree nodes and alternatives
  const maxX = Math.max(
    ...this.treeNodes.map(node => node.position.x + this.NODE_SPACING),
    ...this.treeNodes.flatMap(node => 
      node.alternativePaths.map(alt => alt.position.x + this.NODE_SPACING)
    )
  );
  
  const width = Math.max(1200, maxX + this.CANVAS_PADDING);
  const height = 500;
  
  // Configure  canvas for high DPI displays
  const dpr = window.devicePixelRatio || 1;
  this.canvas.width = width * dpr;
  this.canvas.height = height * dpr;
  this.canvas.style.width = `${width}px`;
  this.canvas.style.height = `${height}px`;
  
  // Escalar contexto para alta resolución
  this.ctx.scale(dpr, dpr);
  
  // Configurations  for better rendering
  this.ctx.imageSmoothingEnabled = true;
  this.ctx.imageSmoothingQuality = 'high';
}

// Main  method to build the tree from answers
private drawTree() {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  
  // Background with subtle gradient
  this.drawBackground();

  // Improved level guides
  this.drawLevelGuides();

  // Draw connections first (back)
  this.connections.forEach(connection => {
    this.drawConnection(connection);
  });

  // Draw main nodes
  this.treeNodes.forEach(node => {
    this.drawNode(node);
  });

  // Draw alternative nodes on top
  this.treeNodes.forEach(node => {
    node.alternativePaths.forEach((altPath: any) => {
      this.drawAlternativeNode(altPath);
    });
  });
}


private drawBackground() {
  const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
  gradient.addColorStop(0, '#fafbfc');
  gradient.addColorStop(1, '#f8fafc');
  
  this.ctx.fillStyle = gradient;
  this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
}

private drawLevelGuides() {
  this.ctx.strokeStyle = 'rgba(99, 102, 241, 0.1)';
  this.ctx.lineWidth = 1;
  this.ctx.setLineDash([]);
  
  Object.entries(this.DIFFICULTY_LEVELS).forEach(([difficulty, level]) => {
    const y = this.getYPositionForDifficulty(difficulty as any);
    
    // Horizontal line for level
    this.ctx.beginPath();
    this.ctx.moveTo(0, y);
    this.ctx.lineTo(this.canvas.width, y);
    this.ctx.stroke();
    
    //  Text label for level
    this.ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
    this.ctx.fillRect(10, y - 25, 120, 20);
    
    this.ctx.fillStyle = '#6366f1';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(difficulty.toUpperCase(), 15, y - 10);
  });
}


private drawConnection(connection: TreeConnection) {
  const fromPos = connection.from.position;
  const toPos = (connection.to as { position: { x: number; y: number } }).position;

  // Configure line style based on connection type
  if (connection.type === 'taken') {
    this.ctx.setLineDash([]);
    this.ctx.lineWidth = 4;
    this.ctx.strokeStyle = connection.isCorrectPath ? '#10b981' : '#ef4444';
    this.ctx.globalAlpha = 1;
  } else {
    this.ctx.setLineDash([12, 8]);
    this.ctx.lineWidth = 3;
    this.ctx.strokeStyle = connection.isCorrectPath ? '#10b981' : '#ef4444';
    this.ctx.globalAlpha = 0.7;
  }
  
  // Draw curved line
  this.drawCurvedLine(fromPos, toPos);

  // Draw modern arrow
  this.drawModernArrow(fromPos, toPos, connection.type === 'taken');
  
  this.ctx.globalAlpha = 1;
  this.ctx.setLineDash([]);
}

private drawCurvedLine(from: {x: number, y: number}, to: {x: number, y: number}) {
  const controlPointOffset = Math.abs(to.x - from.x) * 0.3;
  
  this.ctx.beginPath();
  this.ctx.moveTo(from.x + this.NODE_RADIUS, from.y);
  this.ctx.bezierCurveTo(
    from.x + this.NODE_RADIUS + controlPointOffset, from.y,
    to.x - this.NODE_RADIUS - controlPointOffset, to.y,
    to.x - this.NODE_RADIUS, to.y
  );
  this.ctx.stroke();
}


private drawModernArrow(from: {x: number, y: number}, to: {x: number, y: number}, isTaken: boolean) {
  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  const arrowLength = isTaken ? 18 : 15;
  const arrowAngle = Math.PI / 5;
  
  const endX = to.x - this.NODE_RADIUS;
  const endY = to.y;
  
  this.ctx.lineWidth = isTaken ? 3 : 2;
  this.ctx.lineCap = 'round';
  this.ctx.lineJoin = 'round';
  
  this.ctx.beginPath();
  this.ctx.moveTo(endX, endY);
  this.ctx.lineTo(
    endX - arrowLength * Math.cos(angle - arrowAngle),
    endY - arrowLength * Math.sin(angle - arrowAngle)
  );
  this.ctx.moveTo(endX, endY);
  this.ctx.lineTo(
    endX - arrowLength * Math.cos(angle + arrowAngle),
    endY - arrowLength * Math.sin(angle + arrowAngle)
  );
  this.ctx.stroke();
}

private drawNode(node: DiagnosticTreeNode) {
  const { x, y } = node.position;
  const isSelected = this.selectedNode === node;
  const isHovered = this.hoveredNode === node;
  
  // Sombra suave más grande
  this.ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  this.ctx.beginPath();
  this.ctx.arc(x + 3, y + 3, this.NODE_RADIUS + 2, 0, 2 * Math.PI);
  this.ctx.fill();
  
  // Anillo exterior brillante
  if (isSelected || isHovered) {
    const glowColor = isSelected ? '#7c3aed' : '#6366f1';
    this.ctx.strokeStyle = glowColor;
    this.ctx.lineWidth = 4;
    this.ctx.globalAlpha = 0.6;
    this.ctx.beginPath();
    this.ctx.arc(x, y, this.NODE_RADIUS + 8, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
  
  const gradient = this.ctx.createRadialGradient(x - 8, y - 8, 0, x, y, this.NODE_RADIUS);
  if (node.isCorrect) {
    gradient.addColorStop(0, '#34d399');
    gradient.addColorStop(1, '#059669');
  } else {
    gradient.addColorStop(0, '#f87171');
    gradient.addColorStop(1, '#dc2626');
  }
  
  this.ctx.fillStyle = gradient;
  this.ctx.beginPath();
  this.ctx.arc(x, y, this.NODE_RADIUS, 0, 2 * Math.PI);
  this.ctx.fill();
  
  // Brilliant white border
  this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  this.ctx.lineWidth = 3;
  this.ctx.stroke();

  // Inner colored ring
  this.ctx.strokeStyle = node.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)';
  this.ctx.lineWidth = 6;
  this.ctx.beginPath();
  this.ctx.arc(x, y, this.NODE_RADIUS - 3, 0, 2 * Math.PI);
  this.ctx.stroke();

  // Text label with better typography
  this.ctx.fillStyle = 'white';
  this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  this.ctx.shadowBlur = 2;
  this.ctx.fillText(`Q${this.treeNodes.indexOf(node) + 1}`, x, y);
  this.ctx.shadowColor = 'transparent';

  // Floating status icon
  this.drawFloatingStatusIcon(x, y, node.isCorrect);
}

private drawFloatingStatusIcon(x: number, y: number, isCorrect: boolean) {
  const iconY = y - this.NODE_RADIUS - 15;
  const iconRadius = 12;
  
  // Icon background
  this.ctx.fillStyle = isCorrect ? '#10b981' : '#ef4444';
  this.ctx.beginPath();
  this.ctx.arc(x, iconY, iconRadius, 0, 2 * Math.PI);
  this.ctx.fill();
  
  // White border
  this.ctx.strokeStyle = 'white';
  this.ctx.lineWidth = 2;
  this.ctx.stroke();
  
  // Icon
  this.ctx.fillStyle = 'white';
  this.ctx.font = 'bold 14px Arial';
  this.ctx.textAlign = 'center';
  this.ctx.textBaseline = 'middle';
  this.ctx.fillText(isCorrect ? '✓' : '✗', x, iconY);
}

private drawAlternativeNode(altPath: AlternativePath) {
  const { x, y } = altPath.position;
  const isSelected = this.selectedAlternative === altPath;
  const isHovered = this.hoveredAlternative === altPath;
  const nodeRadius = this.NODE_RADIUS * 0.8;
  
  this.ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
  this.ctx.beginPath();
  this.ctx.arc(x + 2, y + 2, nodeRadius + 2, 0, 2 * Math.PI);
  this.ctx.fill();
  
  // External glow effect
  if (isSelected || isHovered) {
    this.ctx.strokeStyle = isSelected ? '#7c3aed' : '#6366f1';
    this.ctx.lineWidth = 3;
    this.ctx.globalAlpha = 0.8;
    this.ctx.beginPath();
    this.ctx.arc(x, y, nodeRadius + 6, 0, 2 * Math.PI);
    this.ctx.stroke();
    this.ctx.globalAlpha = 1;
  }
    
    // Alternative node gradient
    const gradient = this.ctx.createRadialGradient(x - 6, y - 6, 0, x, y, nodeRadius);
    gradient.addColorStop(0, '#8b5cf6');
    gradient.addColorStop(1, '#6366f1');
    
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(x, y, nodeRadius, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // White dashed border
    this.ctx.strokeStyle = 'white';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([4, 4]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // ALT text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 1;
    this.ctx.fillText('ALT', x, y);
    this.ctx.shadowColor = 'transparent';
    
    // More modern direction indicator
    this.drawDirectionIndicator(x, y, altPath.condition === 'if_correct', nodeRadius);
  }

  // New method for modern direction indicator
  private drawDirectionIndicator(x: number, y: number, isUpward: boolean, nodeRadius: number) {
    const indicatorY = y - nodeRadius - 20;
    const indicatorSize = 8;
    
    // Indicator background
    this.ctx.fillStyle = isUpward ? '#10b981' : '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(x, indicatorY, indicatorSize, 0, 2 * Math.PI);
    this.ctx.fill();
    
    // Directional arrow
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(isUpward ? '↗' : '↘', x, indicatorY);
  }

    private positionAlternatives(alternatives: AlternativePath[], xPosition: number): AlternativePath[] {
    return alternatives.map(alt => ({
      ...alt,
      position: {
      x: xPosition + this.NODE_SPACING * 0.7,
      y: this.getYPositionForDifficulty(alt.difficulty)
      }
    }));
    }

    private generateFallbackAlternatives(answer: AnswerReviewItem, xPosition: number): AlternativePath[] {
    const alternatives: AlternativePath[] = [];
    
    if (answer.isCorrect) {
      alternatives.push({
      question_id: -1,
      question_text: `Alternative basic question (if you had failed)`,
      difficulty: 'basic',
      topic: 'Basic concepts',
      options: ['Option A', 'Option B', 'Option C'],
      correct_answer: 0,
      condition: 'if_incorrect',
      explanation: 'If you had answered incorrectly, you would have received a more basic question to reinforce fundamental concepts.',
      would_lead_to: 'Basic concepts reinforcement path',
      position: {
        x: xPosition + this.NODE_SPACING * 0.7,
        y: this.getYPositionForDifficulty('basic')
      }
      });
    } else {
      alternatives.push({
      question_id: -1,
      question_text: `Alternative advanced question (if you had answered correctly)`,
      difficulty: 'advanced',
      topic: 'Advanced concepts',
      options: ['Option A', 'Option B', 'Option C'],
      correct_answer: 0,
      condition: 'if_correct',
      explanation: 'If you had answered correctly, you would have moved on to a more challenging question.',
      would_lead_to: 'Advanced concepts path',
      position: {
        x: xPosition + this.NODE_SPACING * 0.7,
        y: this.getYPositionForDifficulty('advanced')
      }
      });
    }

    return alternatives;
    }

    private getYPositionForDifficulty(difficulty: 'basic' | 'intermediate' | 'advanced'): number {
    const level = this.DIFFICULTY_LEVELS[difficulty];
    return this.CANVAS_PADDING + (level * this.LEVEL_HEIGHT);
    }

    private generateConnections() {
    for (let i = 0; i < this.treeNodes.length - 1; i++) {
      const currentNode = this.treeNodes[i];
      const nextNode = this.treeNodes[i + 1];

      // Main connection (taken path)
      this.connections.push({
      from: currentNode,
      to: nextNode,
      type: 'taken',
      isCorrectPath: currentNode.isCorrect
      });

      // Alternative connections
      currentNode.alternativePaths.forEach((altPath: AlternativePath) => {
      this.connections.push({
        from: currentNode,
        to: altPath,
        type: 'alternative',
        isCorrectPath: altPath.condition === 'if_correct'
      });
      });
    }
    }

    private setupCanvasEvents() {
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const hoveredNode = this.getNodeAtPosition(x, y);
      const hoveredAlt = this.getAlternativeAtPosition(x, y);
      
      if (hoveredNode !== this.hoveredNode || hoveredAlt !== this.hoveredAlternative) {
      this.hoveredNode = hoveredNode;
      this.hoveredAlternative = hoveredAlt;
      this.drawTree();
      
      if (hoveredNode) {
        this.showNodeTooltip(event, hoveredNode);
      } else if (hoveredAlt) {
        this.showAlternativeTooltip(event, hoveredAlt);
      } else {
        this.hideTooltip();
      }
      }
    });
    
    this.canvas.addEventListener('click', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const clickedNode = this.getNodeAtPosition(x, y);
      const clickedAlt = this.getAlternativeAtPosition(x, y);
      
      if (clickedNode) {
      this.selectNode(clickedNode);
      } else if (clickedAlt) {
      this.selectAlternative(clickedAlt);
      }
    });
    }

    private getAlternativeAtPosition(x: number, y: number): AlternativePath | null {
    for (const node of this.treeNodes) {
      for (const alt of node.alternativePaths) {
      const distance = Math.sqrt(
        Math.pow(x - alt.position.x, 2) + Math.pow(y - alt.position.y, 2)
      );
      if (distance <= this.NODE_RADIUS * 0.8) {
        return alt;
      }
      }
    }
    return null;
    }

    private showAlternativeTooltip(event: MouseEvent, alternative: AlternativePath) {
    console.log('Alternative tooltip:', alternative);
    }

    selectNode(node: DiagnosticTreeNode) {
    this.selectedNode = node;
    this.selectedAlternative = null;
    this.drawTree();
    }

    selectAlternative(alternative: AlternativePath) {
    this.selectedAlternative = alternative;
    this.selectedNode = null;
    this.drawTree();
    }

    private drawArrow(from: {x: number, y: number}, to: {x: number, y: number}) {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    const endX = to.x - this.NODE_RADIUS;
    const endY = to.y;
    
    this.ctx.beginPath();
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle - arrowAngle),
      endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    this.ctx.moveTo(endX, endY);
    this.ctx.lineTo(
      endX - arrowLength * Math.cos(angle + arrowAngle),
      endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    this.ctx.stroke();
    }

    private getNodeAtPosition(x: number, y: number): DiagnosticTreeNode | null {
    return this.treeNodes.find(node => {
      const distance = Math.sqrt(
      Math.pow(x - node.position.x, 2) + Math.pow(y - node.position.y, 2)
      );
      return distance <= this.NODE_RADIUS;
    }) || null;
    }

    private showNodeTooltip(event: MouseEvent, node: DiagnosticTreeNode) {
    console.log('Node tooltip:', node);
    }

    private hideTooltip() {
    // Implement
    }


  getDifficultyColor(difficulty: string): string {
    const colors = {
      'basic': '#10b981',
      'intermediate': '#f59e0b', 
      'advanced': '#ef4444'
    };
    return colors[difficulty as keyof typeof colors] || '#6b7280';
  }

  getOptionLetter(index: number): string {
    return String.fromCharCode(65 + index); // A, B, C, D...
  }
}