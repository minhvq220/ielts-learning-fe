import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <h1>Đăng nhập / Đăng ký</h1>
          <p>Sử dụng tài khoản Google của bạn</p>
        </div>

        <div class="login-content">
          <button 
            class="btn-google" 
            (click)="handleGoogleLogin()"
            [disabled]="isLoading()">
            <svg class="google-icon" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span *ngIf="!isLoading()">Đăng nhập với Google</span>
            <span *ngIf="isLoading()">Đang xử lý...</span>
          </button>

          <div *ngIf="errorMessage()" class="error-message">
            {{ errorMessage() }}
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem;
    }

    .login-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      padding: 3rem;
      max-width: 400px;
      width: 100%;
    }

    .login-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .login-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 0.5rem 0;
    }

    .login-header p {
      color: #666;
      margin: 0;
    }

    .login-content {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .btn-google {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.875rem 1.5rem;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      color: #3c4043;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-google:hover:not(:disabled) {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border-color: #dadce0;
    }

    .btn-google:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .google-icon {
      width: 20px;
      height: 20px;
    }

    .error-message {
      padding: 0.75rem;
      background: #fee2e2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      color: #991b1b;
      font-size: 0.875rem;
      text-align: center;
    }

    @media (max-width: 768px) {
      .login-card {
        padding: 2rem;
      }

      .login-header h1 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class LoginComponent {
  isLoading = signal(false);
  errorMessage = signal('');

  constructor(
    private authService: AuthService,
    private router: Router,
    private loadingService: LoadingService
  ) {}

  async handleGoogleLogin(): Promise<void> {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      this.loadingService.startLoading('Đang đăng nhập với Google...');

      const response = await this.authService.loginWithGoogle();

      this.loadingService.stopLoading();
      this.isLoading.set(false);

      // Redirect to writing or previous page
      this.router.navigate(['/writing']);
    } catch (error: any) {
      this.loadingService.stopLoading();
      this.isLoading.set(false);

      let message = 'Đăng nhập thất bại. Vui lòng thử lại.';
      
      // Handle specific error cases
      if (error?.code === 'auth/redirect-initiated') {
        // Redirect is in progress, show loading message
        this.errorMessage.set('');
        message = '';
        return; // Don't show error, redirect is happening
      } else if (error?.code === 'auth/popup-blocked') {
        message = 'Trình duyệt đã chặn popup đăng nhập. Hệ thống sẽ tự động chuyển sang chế độ redirect...';
        // Note: The redirect should happen automatically from the service
      } else if (error?.code === 'auth/popup-closed-by-user') {
        message = 'Bạn đã đóng cửa sổ đăng nhập. Vui lòng thử lại.';
      } else if (error?.message) {
        message = error.message;
      } else if (error?.error?.message) {
        message = error.error.message;
      }

      this.errorMessage.set(message);
      console.error('Login error:', error);
    }
  }
}

