import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  template: `
    <div class="admin-layout">
      <!-- Sidebar -->
      <aside class="admin-sidebar">
        <div class="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        
        <nav class="sidebar-nav">
          <a 
            routerLink="/admin/writing" 
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
            <span>Writing Admin</span>
          </a>
          
          <a 
            routerLink="/admin/writing-self-check" 
            routerLinkActive="active"
            [routerLinkActiveOptions]="{exact: false}"
            class="nav-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Self-Check Admin</span>
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <a routerLink="/home" class="back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Về trang chủ</span>
          </a>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="admin-main">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .admin-layout {
      display: flex;
      min-height: 100vh;
      background-color: #f5f7fa;
    }

    .admin-sidebar {
      width: 200px;
      background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      flex-direction: column;
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
      z-index: 1001;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 1rem 1.25rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .sidebar-header h2 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 700;
      color: white;
    }

    .sidebar-nav {
      flex: 1;
      padding: 0.75rem 0;
      overflow-y: auto;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 0.75rem 1.25rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      transition: all 0.3s ease;
      border-left: 3px solid transparent;
      font-size: 0.875rem;
    }

    .nav-item:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background-color: rgba(255, 255, 255, 0.15);
      border-left-color: white;
      color: white;
      font-weight: 600;
    }

    .nav-item svg {
      flex-shrink: 0;
      opacity: 0.9;
    }

    .nav-item.active svg {
      opacity: 1;
    }

    .nav-item span {
      flex: 1;
    }

    .sidebar-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }

    .back-link {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      color: rgba(255, 255, 255, 0.9);
      text-decoration: none;
      font-size: 0.8125rem;
      transition: all 0.3s ease;
      padding: 0.5rem;
      border-radius: 6px;
    }

    .back-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .admin-main {
      flex: 1;
      margin-left: 200px;
      padding: 2rem;
      min-height: 100vh;
      padding-top: calc(2rem + 60px); /* Account for header height */
    }

    @media (max-width: 768px) {
      .admin-sidebar {
        transform: translateX(-100%);
        transition: transform 0.3s ease;
      }

      .admin-sidebar.open {
        transform: translateX(0);
      }

      .admin-main {
        margin-left: 0;
        padding: 1rem;
      }
    }
  `]
})
export class AdminLayoutComponent {}

