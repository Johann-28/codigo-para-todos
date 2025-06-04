import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { DiagnosticEvaluationComponent } from './diagnostic-evaluation/diagnostic-evaluation.component';
import { CourseContentComponent } from './course-content/course-content.component';

export const routes: Routes = [
    {
        path: 'diagnostic-evaluation',
        component: DiagnosticEvaluationComponent,
    },
    {
        path: 'home',
        component: HomeComponent
    },
    {
        path: 'learning-path/:id',
        component: CourseContentComponent
    }
];