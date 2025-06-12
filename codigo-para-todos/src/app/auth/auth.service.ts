import { Injectable, signal } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../backend/app/environment/environment';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  role: 'student' | 'instructor' | 'admin';
  enrolledCourses: string[];
  completedCourses: string[];
  preferences: {
    theme: 'light' | 'dark';
    language: 'es' | 'en';
    notifications: boolean;
  };
  createdAt: Date;
  lastLoginAt: Date;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  token?: string;
  timestamp?: Date;
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface UserUpdate {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  preferences?: {
    theme: 'light' | 'dark';
    language: 'es' | 'en';
    notifications: boolean;
  };
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = `${environment  .apiUrl}/auth`;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  private returnUrl: string = '/courses';

  // Signals para reactive programming
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isLoading = signal<boolean>(false);

  // Observables públicos
  public currentUser$ = this.currentUserSubject.asObservable();
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private router: Router, private http: HttpClient) {
    this.returnUrl = '/courses';
    this.initializeAuth();
  }

  private initializeAuth(): void {
    // Verificar si hay una sesión guardada
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('authToken');

    if (savedUser && savedToken) {
      try {
        const user: User = JSON.parse(savedUser);
        this.setCurrentUser(user);
        console.log('Sesión restaurada:', user.email);
      } catch (error) {
        console.error('Error al restaurar sesión:', error);
        this.logout();
      }
    }
  }

  login(email: string, password: string, rememberMe: boolean = false): Observable<AuthResponse> {
    this.isLoading.set(true);

    const loginData: LoginData = {
      email,
      password,
      rememberMe
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, loginData).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user && response.token) {
          // Guardar sesión si se seleccionó "recordarme"
          if (rememberMe) {
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            localStorage.setItem('authToken', response.token);
          } else {
            sessionStorage.setItem('currentUser', JSON.stringify(response.user));
            sessionStorage.setItem('authToken', response.token);
          }

          this.setCurrentUser(response.user);
        }
        
        this.isLoading.set(false);
        return response;
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    this.isLoading.set(true);

    const registerData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      password: userData.password
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, registerData).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user && response.token) {
          // Guardar sesión automáticamente después del registro
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
          sessionStorage.setItem('authToken', response.token);
          this.setCurrentUser(response.user);
        }
        
        this.isLoading.set(false);
        return response;
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  socialLogin(provider: 'google' | 'github' | 'facebook'): Observable<AuthResponse> {
    this.isLoading.set(true);

    return this.http.post<AuthResponse>(`${this.apiUrl}/social-login`, { provider }).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user && response.token) {
          sessionStorage.setItem('currentUser', JSON.stringify(response.user));
          sessionStorage.setItem('authToken', response.token);
          this.setCurrentUser(response.user);
        }
        
        this.isLoading.set(false);
        return response;
      }),
      catchError((error) => {
        this.isLoading.set(false);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    // Llamar al endpoint de logout
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => {
        this.clearSession();
      },
      error: () => {
        // Limpiar sesión local incluso si falla el endpoint
        this.clearSession();
      }
    });
  }

  private clearSession(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    
    this.setCurrentUser(null);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/forgot-password`, { email }).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  updateProfile(userData: UserUpdate): Observable<AuthResponse> {
    const currentUser = this.currentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const updateData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      avatar: userData.avatar,
      preferences: userData.preferences
    };

    return this.http.put<AuthResponse>(`${this.apiUrl}/profile/${currentUser.id}`, updateData).pipe(
      map((response: AuthResponse) => {
        if (response.success && response.user) {
          // Actualizar sesión local
          const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
          storage.setItem('currentUser', JSON.stringify(response.user));
          this.setCurrentUser(response.user);
        }
        return response;
      }),
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    const currentUser = this.currentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    const passwordData: PasswordChange = {
      currentPassword,
      newPassword
    };

    return this.http.put<AuthResponse>(`${this.apiUrl}/change-password/${currentUser.id}`, passwordData).pipe(
      catchError((error) => {
        return throwError(() => error);
      })
    );
  }

  // Métodos auxiliares
  setReturnUrl(url: string): void {
    this.returnUrl = url;
  }

  getReturnUrl(): string {
    return this.returnUrl;
  }

  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  hasRole(role: string): boolean {
    const user = this.currentUser();
    return user?.role === role;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  private setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(!!user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!user);
  }
}