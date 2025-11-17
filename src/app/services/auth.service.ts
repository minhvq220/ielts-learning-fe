import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { FirebaseService } from './firebase.service';
import { RecaptchaService } from './recaptcha.service';
import { AppConfig } from '../config/app.config';

export interface LoginResponse {
  accessToken: string;
  refreshToken?: string;
  user: {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
}

export interface AuthState {
  isAuthenticated: boolean;
  user: LoginResponse['user'] | null;
  token: string | null;
}

/**
 * Authentication Service
 * Handles authentication flow: Google Login → Firebase → Backend → JWT
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = `${AppConfig.api.baseUrl}/api/auth`;
  
  private authState = signal<AuthState>({
    isAuthenticated: false,
    user: null,
    token: null,
  });

  private authStateSubject = new BehaviorSubject<AuthState>(this.authState());

  constructor(
    private http: HttpClient,
    private router: Router,
    private firebaseService: FirebaseService,
    private recaptchaService: RecaptchaService
  ) {
    this.loadAuthStateFromStorage();
  }

  /**
   * Get current auth state as observable
   */
  getAuthState$(): Observable<AuthState> {
    return this.authStateSubject.asObservable();
  }

  /**
   * Get current auth state
   */
  getAuthState(): AuthState {
    return this.authState();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authState().isAuthenticated;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.authState().token;
  }

  /**
   * Login with Google
   */
  async loginWithGoogle(): Promise<LoginResponse> {
    try {
      // Step 1: Sign in with Google via Firebase
      if (!this.firebaseService.isReady()) {
        throw new Error('Firebase is not initialized. Please check your configuration.');
      }

      const firebaseResult = await this.firebaseService.signInWithGoogle();
      const firebaseUser = firebaseResult.user;

      // Step 2: Get Firebase ID Token
      const firebaseIdToken = await firebaseUser.getIdToken();
      if (!firebaseIdToken) {
        throw new Error('Failed to get Firebase ID token');
      }

      // Step 3: Get reCAPTCHA token
      let recaptchaToken: string | null = null;
      try {
        if (this.recaptchaService.isReady()) {
          recaptchaToken = await this.recaptchaService.execute('login');
          if (!recaptchaToken || recaptchaToken.trim() === '') {
            console.warn('⚠️ reCAPTCHA returned empty token');
            recaptchaToken = null;
          }
        } else {
          console.warn('⚠️ reCAPTCHA is not ready, skipping');
        }
      } catch (error) {
        console.warn('⚠️ reCAPTCHA failed, continuing without it:', error);
        recaptchaToken = null; // Set to null instead of empty string
      }

      // Step 4: Send to backend for verification
      const loginResponse = await this.verifyWithBackend(firebaseIdToken, recaptchaToken || '').toPromise();

      if (!loginResponse) {
        throw new Error('Login failed: No response from server');
      }

      // Step 5: Save auth state
      this.updateAuthState({
        isAuthenticated: true,
        user: loginResponse.user,
        token: loginResponse.accessToken,
      });

      this.saveAuthStateToStorage();

      return loginResponse;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Verify with backend
   */
  private verifyWithBackend(firebaseIdToken: string, recaptchaToken: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/google-login`, {
      firebaseIdToken,
      recaptchaToken,
    }).pipe(
      catchError((error) => {
        console.error('Backend verification error:', error);
        throw error;
      })
    );
  }

  /**
   * Logout
   */
  async logout(): Promise<void> {
    try {
      // Sign out from Firebase
      if (this.firebaseService.isReady()) {
        await this.firebaseService.signOut();
      }

      // Clear auth state
      this.updateAuthState({
        isAuthenticated: false,
        user: null,
        token: null,
      });

      this.clearAuthStateFromStorage();

      // Redirect to home
      this.router.navigate(['/home']);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Update auth state
   */
  private updateAuthState(state: AuthState): void {
    this.authState.set(state);
    this.authStateSubject.next(state);
  }

  /**
   * Save auth state to localStorage
   */
  private saveAuthStateToStorage(): void {
    try {
      const state = this.authState();
      localStorage.setItem('auth_token', state.token || '');
      localStorage.setItem('auth_user', JSON.stringify(state.user));
    } catch (error) {
      console.error('Error saving auth state:', error);
    }
  }

  /**
   * Load auth state from localStorage
   */
  private loadAuthStateFromStorage(): void {
    try {
      const token = localStorage.getItem('auth_token');
      const userStr = localStorage.getItem('auth_user');

      if (token && userStr) {
        const user = JSON.parse(userStr);
        this.updateAuthState({
          isAuthenticated: true,
          user,
          token,
        });
      }
    } catch (error) {
      console.error('Error loading auth state:', error);
      this.clearAuthStateFromStorage();
    }
  }

  /**
   * Clear auth state from localStorage
   */
  private clearAuthStateFromStorage(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  /**
   * Get authorization header
   */
  getAuthHeader(): { [key: string]: string } {
    const token = this.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
}

