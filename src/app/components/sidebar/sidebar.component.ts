import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="sidebar">
      <div class="sidebar-content">
        <div class="skill-section" style="display: none;">
          <h3>Kỹ năng IELTS</h3>
          <ul class="skill-list">
            <!-- <li>
              <a routerLink="/reading" routerLinkActive="active" class="skill-link">
                <span class="skill-icon">📖</span>
                <span>Reading</span>
              </a>
            </li> -->
            <!-- <li>
              <a routerLink="/listening" routerLinkActive="active" class="skill-link">
                <span class="skill-icon">🎧</span>
                <span>Listening</span>
              </a>
            </li> -->
            <li>
              <a routerLink="/writing" routerLinkActive="active" class="skill-link">
                <span class="skill-icon">✍️</span>
                <span>Writing</span>
              </a>
            </li>
            <!-- <li>
              <a routerLink="/speaking" routerLinkActive="active" class="skill-link">
                <span class="skill-icon">🎤</span>
                <span>Speaking</span>
              </a>
            </li> -->
          </ul>
        </div>
        
        <div class="progress-section" style="display: none;">
          <h3>Tiến độ học tập</h3>
          <!-- <div class="progress-item">
            <span>Reading</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 75%"></div>
            </div>
            <span class="progress-text">75%</span>
          </div> -->
          <!-- <div class="progress-item">
            <span>Listening</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 60%"></div>
            </div>
            <span class="progress-text">60%</span>
          </div> -->
          <div class="progress-item">
            <span>Writing</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 45%"></div>
            </div>
            <span class="progress-text">45%</span>
          </div>
          <!-- <div class="progress-item">
            <span>Speaking</span>
            <div class="progress-bar">
              <div class="progress-fill" style="width: 30%"></div>
            </div>
            <span class="progress-text">30%</span>
          </div> -->
        </div>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: 280px;
      background-color: #2c3e50;
      color: white;
      overflow-y: auto;
      box-shadow: 2px 0 10px rgba(0,0,0,0.1);
    }

    .sidebar-content {
      padding: 1.5rem;
    }

    .skill-section h3,
    .progress-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.1rem;
      color: #ecf0f1;
      border-bottom: 1px solid #34495e;
      padding-bottom: 0.5rem;
    }

    .skill-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .skill-list li {
      margin-bottom: 0.5rem;
    }

    .skill-link {
      display: flex;
      align-items: center;
      padding: 0.75rem;
      color: #bdc3c7;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .skill-link:hover {
      background-color: #34495e;
      color: white;
    }

    .skill-link.active {
      background-color: #3498db;
      color: white;
    }

    .skill-icon {
      margin-right: 0.75rem;
      font-size: 1.2rem;
    }

    .progress-section {
      margin-top: 2rem;
    }

    .progress-item {
      display: flex;
      align-items: center;
      margin-bottom: 1rem;
      font-size: 0.9rem;
    }

    .progress-item span:first-child {
      width: 80px;
      color: #bdc3c7;
    }

    .progress-bar {
      flex: 1;
      height: 8px;
      background-color: #34495e;
      border-radius: 4px;
      margin: 0 0.5rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3498db, #2ecc71);
      transition: width 0.3s ease;
    }

    .progress-text {
      width: 40px;
      text-align: right;
      color: #2ecc71;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .sidebar {
        width: 100%;
        height: auto;
        order: 2;
      }
    }
  `]
})
export class SidebarComponent {}
