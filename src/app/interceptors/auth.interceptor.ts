import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AppConfig } from '../config/app.config';
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
  if (token && !req.url.includes(`${AppConfig.api.apiBasePath}/auth`)) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Handle response
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Check if error is related to token expiration/invalid
      const isTokenExpired = isTokenExpiredError(error);

      // Handle 401 Unauthorized - usually means token expired/invalid
      // Check response message to be sure, but default to token expired if message is unclear
      if (error.status === 401) {
        const errorMessage = extractErrorMessage(error);
        // If message indicates token issue, or if no clear message (default to token expired for 401)
        if (isTokenExpired || !errorMessage || errorMessage.trim() === '') {
          console.warn('⚠️ Unauthorized request. Token expired or invalid. Logging out...');
          
          // Show notification to user
          alert('Phiên đăng nhập đã hết. Vui lòng thực hiện đăng nhập lại.');
          
          // Logout and redirect to login page
          authService.logout('/login').catch((err) => {
            console.error('Error during logout:', err);
          });
        } else {
          console.warn('⚠️ Unauthorized request. Access denied:', errorMessage);
        }
      }

      // Handle 403 Forbidden - check response message to determine if it's token related
      // 403 usually means insufficient permissions, but could also be token expired in some cases
      if (error.status === 403) {
        if (isTokenExpired) {
          console.warn('⚠️ Forbidden: Token expired or invalid. Logging out...');
          
          // Show notification to user
          alert('Phiên đăng nhập đã hết. Vui lòng thực hiện đăng nhập lại.');
          
          // Logout and redirect to login page
          authService.logout('/login').catch((err) => {
            console.error('Error during logout:', err);
          });
        } else {
          const errorMessage = extractErrorMessage(error);
          console.warn('⚠️ Forbidden: Access denied - insufficient permissions', errorMessage || '');
        }
      }

      return throwError(() => error);
    })
  );
}

/**
 * Check if error is related to token expiration or invalid token
 */
function isTokenExpiredError(error: HttpErrorResponse): boolean {
  // Check error message from backend
  const errorMessage = extractErrorMessage(error);
  if (!errorMessage) {
    return false;
  }

  const messageLower = errorMessage.toLowerCase();
  
  // Check for token-related keywords
  const tokenExpiredKeywords = [
    'jwt expired',
    'invalid jwt token',
    'jwt token',
    'token expired',
    'expired',
    'hết hạn',
    'phiên đăng nhập đã hết',
    'token invalid',
    'invalid token',
    'unauthorized',
    'authentication failed'
  ];

  return tokenExpiredKeywords.some(keyword => messageLower.includes(keyword));
}

/**
 * Extract error message from HttpErrorResponse
 */
function extractErrorMessage(error: HttpErrorResponse): string | null {
  if (!error) {
    return null;
  }

  // Try to get message from error.error (backend response)
  if (error.error) {
    // If error.error is a string
    if (typeof error.error === 'string') {
      return error.error;
    }
    
    // If error.error is an object with message property
    if (error.error.message) {
      return error.error.message;
    }
    
    // If error.error is an object with error property
    if (error.error.error) {
      if (typeof error.error.error === 'string') {
        return error.error.error;
      }
      if (error.error.error.message) {
        return error.error.error.message;
      }
    }
  }

  // Fallback to error message
  if (error.message) {
    return error.message;
  }

  return null;
};

