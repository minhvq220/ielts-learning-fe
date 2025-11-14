import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="header">
      <div class="header-content">
        <div class="logo">
          <a routerLink="/home" class="logo-link">
            <h1>YouPassCopy</h1>
          </a>
        </div>
        <nav class="nav">
          <a routerLink="/home" routerLinkActive="active" class="nav-link">Trang chủ</a>
          <a routerLink="/reading" routerLinkActive="active" class="nav-link">Reading</a>
          <a routerLink="/listening" routerLinkActive="active" class="nav-link">Listening</a>
          <a routerLink="/writing" routerLinkActive="active" class="nav-link">Writing</a>
          <a routerLink="/speaking" routerLinkActive="active" class="nav-link">Speaking</a>
        </nav>
        <div class="user-actions">
          <a routerLink="/admin/test" class="btn btn-secondary">Test Admin</a>
          <a routerLink="/admin/writing" class="btn btn-secondary">Writing Admin</a>
          <button class="btn btn-primary">Đăng nhập</button>
          <button class="btn btn-secondary">Đăng ký</button>
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
      position: sticky;
      top: 0;
      z-index: 1000; /* Highest z-index to ensure header is always on top */
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .logo-link {
      text-decoration: none;
      color: white;
    }

    .logo h1 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: bold;
    }

    .nav {
      display: flex;
      gap: 2rem;
    }

    .nav-link {
      color: white;
      text-decoration: none;
      padding: 0.5rem 1rem;
      border-radius: 5px;
      transition: background-color 0.3s;
    }

    .nav-link:hover,
    .nav-link.active {
      background-color: rgba(255,255,255,0.2);
    }

    .user-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
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
        gap: 1rem;
        padding: 1rem;
      }

      .nav {
        gap: 1rem;
      }

      .user-actions {
        gap: 0.5rem;
      }
    }
  `]
})
export class HeaderComponent {}
