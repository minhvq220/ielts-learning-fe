import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoadingService } from '../../services/loading.service';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loading-container">
      <div class="loading-content">
        <div class="spinner"></div>
        <h3>{{ loadingService.message() }}</h3>
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="loadingService.progress()"></div>
        </div>
        <p class="loading-message">{{ loadingService.progress() | number:'1.1-1' }}% hoàn thành</p>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.95);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .loading-content {
      text-align: center;
      max-width: 400px;
      padding: 2rem;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0d9488;
      border-radius: 0;
      animation: spin 1s linear infinite;
      margin: 0 auto 2rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-content h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
      font-size: 1.5rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background-color: #e9ecef;
      border-radius: 0;
      overflow: hidden;
      margin-bottom: 1rem;
    }

    .progress-fill {
      height: 100%;
      background: #0d9488;
      transition: width 0.3s ease;
    }

    .loading-message {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }
  `]
})
export class LoadingComponent {
  loadingService = inject(LoadingService);
}
