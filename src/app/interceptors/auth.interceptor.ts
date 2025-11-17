import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * HTTP Interceptor to automatically add JWT token to requests
 * and handle authentication errors
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Get token from auth service
  const token = authService.getToken();

  // Clone request and add Authorization header if token exists
  // Skip adding token for auth endpoints
  if (token && !req.url.includes('/api/auth/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized - token expired or invalid
      if (error.status === 401) {
        console.warn('⚠️ Unauthorized request. Logging out...');
        authService.logout().catch((err) => {
          console.error('Error during logout:', err);
        });
        router.navigate(['/home']);
      }

      // Handle 403 Forbidden
      if (error.status === 403) {
        console.warn('⚠️ Forbidden: Access denied');
      }

      return throwError(() => error);
    })
  );
};

