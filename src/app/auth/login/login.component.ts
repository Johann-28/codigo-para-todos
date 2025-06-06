import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals para manejo de estado
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');
  isLoginMode = signal(true);

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  toggleMode() {
    this.isLoginMode.set(!this.isLoginMode());
    this.errorMessage.set('');
    this.resetForms();
  }

  togglePasswordVisibility() {
    this.showPassword.set(!this.showPassword());
  }

  resetForms() {
    this.loginForm.reset();
    this.registerForm.reset();
  }

  onLogin() {
    if (this.loginForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { email, password, rememberMe } = this.loginForm.value;

      this.authService.login(email, password, rememberMe).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          
          if (response.success) {
            // Redireccionar a courses o página anterior
            const returnUrl = this.authService.getReturnUrl() || '/courses';
            this.router.navigate([returnUrl]);
          } else {
            this.errorMessage.set(response.message || 'Error de autenticación');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Error de conexión. Intenta nuevamente.');
          console.error('Login error:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.loginForm);
    }
  }

  onRegister() {
    if (this.registerForm.valid) {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const { firstName, lastName, email, password } = this.registerForm.value;

      this.authService.register({
        firstName,
        lastName, 
        email,
        password
      }).subscribe({
        next: (response) => {
          this.isLoading.set(false);
          
          if (response.success) {
            // Auto-login después del registro
            this.authService.login(email, password, false).subscribe({
              next: () => {
                this.router.navigate(['/courses']);
              }
            });
          } else {
            this.errorMessage.set(response.message || 'Error en el registro');
          }
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set('Error de conexión. Intenta nuevamente.');
          console.error('Register error:', error);
        }
      });
    } else {
      this.markFormGroupTouched(this.registerForm);
    }
  }

  socialLogin(provider: 'google' | 'github' | 'facebook') {
    this.isLoading.set(true);
    
    this.authService.socialLogin(provider).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        if (response.success) {
          this.router.navigate(['/courses']);
        } else {
          this.errorMessage.set(`Error al conectar con ${provider}`);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set(`Error al conectar con ${provider}`);
      }
    });
  }

  forgotPassword() {
    const email = this.loginForm.get('email')?.value;
    
    if (!email) {
      this.errorMessage.set('Por favor ingresa tu email primero');
      return;
    }

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Se ha enviado un enlace de recuperación a tu email');
        } else {
          this.errorMessage.set('Error al enviar email de recuperación');
        }
      },
      error: () => {
        this.errorMessage.set('Error al enviar email de recuperación');
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Helpers para el template
  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${fieldName} es requerido`;
      if (field.errors['email']) return 'Email inválido';
      if (field.errors['minlength']) return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['passwordMismatch']) return 'Las contraseñas no coinciden';
    }
    
    return '';
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field?.touched && field?.errors);
  }
}