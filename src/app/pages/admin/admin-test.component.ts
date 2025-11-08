import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-admin-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-test-container">
      <h1>🎉 Trang Admin đã hoạt động!</h1>
      <p>Chào mừng bạn đến với trang quản lý Writing IELTS</p>
      
      <div class="test-info">
        <h2>Thông tin test:</h2>
        <ul>
          <li>✅ Routing hoạt động</li>
          <li>✅ Component load thành công</li>
          <li>✅ Angular 20.2.0</li>
        </ul>
      </div>

      <div class="actions">
        <button class="btn btn-primary" (click)="goToWritingAdmin()">
          Vào trang Writing Admin
        </button>
        <button class="btn btn-secondary" (click)="goHome()">
          Về trang chủ
        </button>
      </div>
    </div>
  `,
  styles: [`
    .admin-test-container {
      padding: 2rem;
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }

    h1 {
      color: #28a745;
      margin-bottom: 1rem;
    }

    .test-info {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 8px;
      margin: 2rem 0;
      text-align: left;
    }

    .test-info ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .test-info li {
      margin-bottom: 0.5rem;
    }

    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }
  `]
})
export class AdminTestComponent {
  goToWritingAdmin(): void {
    window.location.href = '/admin/writing';
  }

  goHome(): void {
    window.location.href = '/';
  }
}
