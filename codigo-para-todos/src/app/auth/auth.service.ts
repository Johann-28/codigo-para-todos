import { Injectable, signal } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { delay, map, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

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
}

export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
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

  // Base de datos mock de usuarios
  private mockUsers: User[] = [
    {
      id: '1',
      firstName: 'Juan',
      lastName: 'Pérez',
      email: 'juan@email.com',
      avatar: '👨‍💻',
      role: 'student',
      enrolledCourses: ['basic-programming', 'web-development'],
      completedCourses: [],
      preferences: {
        theme: 'light',
        language: 'es',
        notifications: true
      },
      createdAt: new Date('2024-01-15'),
      lastLoginAt: new Date()
    },
    {
      id: '2',
      firstName: 'María',
      lastName: 'García',
      email: 'maria@email.com',
      avatar: '👩‍💻',
      role: 'student',
      enrolledCourses: ['basic-programming'],
      completedCourses: [],
      preferences: {
        theme: 'dark',
        language: 'es',
        notifications: false
      },
      createdAt: new Date('2024-02-10'),
      lastLoginAt: new Date()
    },
    {
      id: '3',
      firstName: 'Admin',
      lastName: 'Sistema',
      email: 'admin@email.com',
      avatar: '🔧',
      role: 'admin',
      enrolledCourses: [],
      completedCourses: [],
      preferences: {
        theme: 'light',
        language: 'es',
        notifications: true
      },
      createdAt: new Date('2024-01-01'),
      lastLoginAt: new Date()
    }
  ];

  constructor(private router: Router) {
    this.returnUrl = '/courses'; // Cambiar la URL por defecto
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

    return of(null).pipe(
      delay(1500), // Simular delay de red
      map(() => {
        // Validación de credenciales mock
        const user = this.mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

        if (!user) {
          throw new Error('Usuario no encontrado');
        }

        // Simular validación de contraseña (en producción sería hash)
        if (password.length < 6) {
          throw new Error('Contraseña incorrecta');
        }

        // Actualizar última conexión
        user.lastLoginAt = new Date();

        // Generar token mock
        const token = this.generateMockToken(user);

        // Guardar sesión si se seleccionó "recordarme"
        if (rememberMe) {
          localStorage.setItem('currentUser', JSON.stringify(user));
          localStorage.setItem('authToken', token);
        } else {
          sessionStorage.setItem('currentUser', JSON.stringify(user));
          sessionStorage.setItem('authToken', token);
        }

        this.setCurrentUser(user);

        return {
          success: true,
          message: 'Inicio de sesión exitoso',
          user,
          token
        };
      }),
      catchError((error) => {
        return of({
          success: false,
          message: error.message || 'Error en el inicio de sesión'
        });
      }),
      map((response) => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    this.isLoading.set(true);

    return of(null).pipe(
      delay(2000), // Simular delay de registro
      map(() => {
        // Verificar si el email ya existe
        const existingUser = this.mockUsers.find(u => 
          u.email.toLowerCase() === userData.email.toLowerCase()
        );

        if (existingUser) {
          throw new Error('Este email ya está registrado');
        }

        // Crear nuevo usuario
        const newUser: User = {
          id: (this.mockUsers.length + 1).toString(),
          firstName: userData.firstName,
          lastName: userData.lastName,
          email: userData.email,
          avatar: this.generateRandomAvatar(),
          role: 'student',
          enrolledCourses: [],
          completedCourses: [],
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: true
          },
          createdAt: new Date(),
          lastLoginAt: new Date()
        };

        // Agregar a la base de datos mock
        this.mockUsers.push(newUser);

        // Generar token
        const token = this.generateMockToken(newUser);

        return {
          success: true,
          message: 'Cuenta creada exitosamente',
          user: newUser,
          token
        };
      }),
      catchError((error) => {
        return of({
          success: false,
          message: error.message || 'Error al crear la cuenta'
        });
      }),
      map((response) => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  socialLogin(provider: 'google' | 'github' | 'facebook'): Observable<AuthResponse> {
    this.isLoading.set(true);

    return of(null).pipe(
      delay(1000),
      map(() => {
        // Simular login social exitoso
        const mockSocialUser: User = {
          id: 'social_' + Date.now(),
          firstName: 'Usuario',
          lastName: provider.charAt(0).toUpperCase() + provider.slice(1),
          email: `usuario.${provider}@email.com`,
          avatar: this.getSocialAvatar(provider),
          role: 'student',
          enrolledCourses: [],
          completedCourses: [],
          preferences: {
            theme: 'light',
            language: 'es',
            notifications: true
          },
          createdAt: new Date(),
          lastLoginAt: new Date()
        };

        this.mockUsers.push(mockSocialUser);
        const token = this.generateMockToken(mockSocialUser);
        
        sessionStorage.setItem('currentUser', JSON.stringify(mockSocialUser));
        sessionStorage.setItem('authToken', token);
        
        this.setCurrentUser(mockSocialUser);

        return {
          success: true,
          message: `Conectado con ${provider}`,
          user: mockSocialUser,
          token
        };
      }),
      catchError(() => {
        return of({
          success: false,
          message: `Error al conectar con ${provider}`
        });
      }),
      map((response) => {
        this.isLoading.set(false);
        return response;
      })
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('authToken');
    
    this.setCurrentUser(null);
    this.router.navigate(['/auth/login']);
  }

  forgotPassword(email: string): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        const user = this.mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (!user) {
          throw new Error('Email no encontrado');
        }

        // En producción: enviar email real
        console.log(`Email de recuperación enviado a: ${email}`);

        return {
          success: true,
          message: 'Email de recuperación enviado'
        };
      }),
      catchError((error) => {
        return of({
          success: false,
          message: error.message || 'Error al enviar email'
        });
      })
    );
  }

  updateProfile(userData: Partial<User>): Observable<AuthResponse> {
    const currentUser = this.currentUser();
    
    if (!currentUser) {
      return throwError(() => new Error('Usuario no autenticado'));
    }

    return of(null).pipe(
      delay(800),
      map(() => {
        const updatedUser = { ...currentUser, ...userData };
        
        // Actualizar en mock database
        const userIndex = this.mockUsers.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
          this.mockUsers[userIndex] = updatedUser;
        }

        // Actualizar sesión
        const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
        storage.setItem('currentUser', JSON.stringify(updatedUser));
        
        this.setCurrentUser(updatedUser);

        return {
          success: true,
          message: 'Perfil actualizado exitosamente',
          user: updatedUser
        };
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<AuthResponse> {
    return of(null).pipe(
      delay(1000),
      map(() => {
        // Simular validación de contraseña actual
        if (currentPassword.length < 6) {
          throw new Error('Contraseña actual incorrecta');
        }

        if (newPassword.length < 8) {
          throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
        }

        return {
          success: true,
          message: 'Contraseña actualizada exitosamente'
        };
      }),
      catchError((error) => {
        return of({
          success: false,
          message: error.message
        });
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

  private setCurrentUser(user: User | null): void {
    this.currentUser.set(user);
    this.isAuthenticated.set(!!user);
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(!!user);
  }

  private generateMockToken(user: User): string {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 horas
    };
    
    // En producción sería un JWT real
    return 'mock_jwt_' + btoa(JSON.stringify(payload));
  }

  private generateRandomAvatar(): string {
    const avatars = ['👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🎓', '👩‍🎓', '🧑‍🎓', '🤓', '😊', '🚀', '💡'];
    return avatars[Math.floor(Math.random() * avatars.length)];
  }

  private getSocialAvatar(provider: string): string {
    const avatars = {
      google: '🔍',
      github: '🐙',
      facebook: '📘'
    };
    return avatars[provider as keyof typeof avatars] || '👤';
  }
}