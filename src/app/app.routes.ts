import { Routes } from '@angular/router';
import { AuthGuard, NoAuthGuard, RoleGuard } from './auth/auth.guard';

export const routes: Routes = [
  // Main route redirects to courses if authenticated
  {
    path: '',
    redirectTo: '/courses',
    pathMatch: 'full'
  },
  
  // Authentication routes
  {
    path: 'auth',
    canActivate: [NoAuthGuard], // Only accessible if NOT authenticated
    children: [
      {
        path: 'login',
        loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        redirectTo: 'login' // All in one component
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Protected routes (require authentication)
  {
    path: 'dashboard',
    loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
    canActivate: [AuthGuard]
  },

  // Home/Landing page (accessible for authenticated users)
  {
    path: 'home',
    loadComponent: () => import('./home/home.component').then(m => m.HomeComponent),
    canActivate: [AuthGuard]
  },

  // Courses (requires authentication)
  {
    path: 'courses',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./home/home.component').then(m => m.HomeComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./course-content/course-content.component').then(m => m.CourseContentComponent)
      }
    ]
  },

  // User profile
  {
    path: 'profile',
    loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
    canActivate: [AuthGuard]
  },

  // Settings
  {
    path: 'settings',
    loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
    canActivate: [AuthGuard]
  },

  // Admin routes (admin only)
  {
    path: 'admin',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: 'users',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: 'courses',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Instructor routes (instructors only)
  {
    path: 'instructor',
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['instructor', 'admin'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: 'my-courses',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: 'create-course',
        loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // Error pages
  {
    path: 'unauthorized',
    loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
  },
  {
    path: '404',
    loadComponent: () => import('./under-construccion/under-construccion.component').then(m => m.UnderConstruccionComponent),
  },

  // Catch-all route (must be last)
  {
    path: '**',
    redirectTo: '/404'
  }
];

// Additional router configuration
export const routerConfig = {
  enableTracing: false, // Change to true for debug
  onSameUrlNavigation: 'reload' as const
};