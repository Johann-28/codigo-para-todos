import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { routes } from './app/app.routes';

// Bootstraps the Angular application with the specified providers
bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes), // Provides routing configuration
    provideHttpClient(withInterceptorsFromDi()), // Configures HttpClient with interceptors from DI
    importProvidersFrom(FormsModule), // Imports FormsModule providers
    // Add other providers as needed
  ]
}).catch(err => console.error(err));