import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header" [class.hidden]="!isHeaderVisible()">
      <div class="header-content">
        <div class="logo">
          <a routerLink="/writing" class="logo-link">
            <h1>YouPassCopy</h1>
          </a>
        </div>
        <nav class="nav">
          <!-- <a routerLink="/reading" routerLinkActive="active" class="nav-link">Reading</a> -->
          <!-- <a routerLink="/listening" routerLinkActive="active" class="nav-link">Listening</a> -->
          <a routerLink="/writing" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">Đề Writing</a>
          <a routerLink="/writing/self-check" routerLinkActive="active" class="nav-link">Tự kiểm tra Writing</a>
          <!-- <a routerLink="/speaking" routerLinkActive="active" class="nav-link">Speaking</a> -->
        </nav>
        <div class="user-actions">
          <!-- Admin link - only visible to admins -->
          <div *ngIf="authService.isAdmin()">
            <a routerLink="/admin/writing" class="btn btn-secondary">Admin</a>
          </div>
          <div *ngIf="!authService.isAuthenticated()" class="auth-buttons">
            <button class="btn btn-primary" (click)="goToLogin()">Đăng nhập</button>
          </div>
          <div *ngIf="authService.isAuthenticated()" class="user-info">
            <span class="user-name">{{ authService.getAuthState().user?.name }}</span>
            <button class="btn btn-secondary" (click)="logout()">Đăng xuất</button>
          </div>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000; /* Highest z-index to ensure header is always on top */
      transition: transform 0.3s ease-in-out;
      transform: translateY(0);
    }

    .header.hidden {
      transform: translateY(-100%);
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 1rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-link {
      text-decoration: none;
      color: white;
    }

    .logo h1 {
      margin: 0;
      font-size: 0.9rem;
      font-weight: bold;
    }

    .nav {
      display: flex;
      gap: 1rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.25rem 0.5rem;
      border-radius: 2.5px;
      transition: background-color 0.3s;
      font-size: 0.5rem;
    }

    .nav-link:hover,
    .nav-link.active {
      background-color: rgba(255,255,255,0.2);
    }

    .user-actions {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .auth-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .user-name {
      font-size: 0.5rem;
      color: white;
      margin-right: 0.25rem;
    }

    .btn {
      padding: 0.25rem 0.5rem;
      border: none;
      border-radius: 2.5px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      font-size: 0.5rem;
    }

    .btn-primary {
      background-color: #28a745;
      color: white;
    }

    .btn-primary:hover {
      background-color: #218838;
    }

    .btn-secondary {
      background-color: transparent;
      color: white;
      border: 1px solid white;
    }

    .btn-secondary:hover {
      background-color: white;
      color: #667eea;
    }

    @media (max-width: 768px) {
      .header-content {
        flex-direction: column;
        gap: 0.5rem;
        padding: 0.5rem;
      }

      .nav {
        gap: 0.5rem;
      }

      .user-actions {
        gap: 0.25rem;
      }
    }
  `]
})
export class HeaderComponent implements OnInit, OnDestroy {
  isHeaderVisible = signal(true);
  private lastScrollTop = 0;
  private scrollHandler: (() => void) | null = null;

  constructor(
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Initialize header visibility
    this.handleHeaderVisibility();
    
    // Setup scroll listener
    let scrollUpdateFrame: number | null = null;
    this.scrollHandler = () => {
      if (scrollUpdateFrame) {
        cancelAnimationFrame(scrollUpdateFrame);
      }
      
      scrollUpdateFrame = requestAnimationFrame(() => {
        this.handleHeaderVisibility();
        scrollUpdateFrame = null;
      });
    };

    window.addEventListener('scroll', this.scrollHandler, true);
  }

  ngOnDestroy(): void {
    // Cleanup scroll listener
    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, true);
    }
  }

  private handleHeaderVisibility(): void {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Hide header when scrolling down
    if (scrollTop > this.lastScrollTop && scrollTop > 50) {
      // Scrolling down and past 50px - hide header
      this.isHeaderVisible.set(false);
    } else if (scrollTop <= 50) {
      // Near top - always show header
      this.isHeaderVisible.set(true);
    }
    
    this.lastScrollTop = scrollTop;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  async logout(): Promise<void> {
    try {
      await this.authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
