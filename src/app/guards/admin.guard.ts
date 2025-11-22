import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Admin Guard
 * Protects routes that require ADMIN role
 */
export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    // Redirect to login if not authenticated
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  if (!authService.isAdmin()) {
    // Redirect to home if not admin
    router.navigate(['/home'], { queryParams: { error: 'unauthorized' } });
    return false;
  }

  return true;
};

