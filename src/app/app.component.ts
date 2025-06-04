import { Component } from '@angular/core';
import { DiagnosticEvaluationComponent } from './diagnostic-evaluation/diagnostic-evaluation.component';

@Component({
  selector: 'app-root',
  imports: [DiagnosticEvaluationComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'codigo-para-todos';
}
