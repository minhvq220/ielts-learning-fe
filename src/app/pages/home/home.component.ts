import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home-container">
      <div class="hero-section">
        <div class="hero-content">
          <h1 class="hero-title">Luyện thi IELTS hiệu quả</h1>
          <p class="hero-subtitle">Nâng cao 4 kỹ năng Reading, Listening, Writing, Speaking với AI chấm bài thông minh</p>
          <div class="hero-actions">
            <button class="btn btn-primary btn-large" routerLink="/reading">Bắt đầu luyện tập</button>
            <button class="btn btn-secondary btn-large">Tìm hiểu thêm</button>
          </div>
        </div>
      </div>

      <div class="features-section">
        <div class="container">
          <h2 class="section-title">Tính năng nổi bật</h2>
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon">📖</div>
              <h3>Reading</h3>
              <p>Giao diện chia đôi màn hình, timer đếm ngược, chế độ tra từ thông minh với giải thích context</p>
              <ul class="feature-list">
                <li>Cam 10-20 & Forecast tests</li>
                <li>Chế độ thi và luyện tập</li>
                <li>Đáp án chi tiết, dễ hiểu</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎧</div>
              <h3>Listening</h3>
              <p>Tương tự Reading với audio player chất lượng cao và giao diện thân thiện</p>
              <ul class="feature-list">
                <li>Audio chất lượng cao</li>
                <li>Giao diện trực quan</li>
                <li>Chấm bài tự động</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">✍️</div>
              <h3>Writing</h3>
              <p>AI chấm bài chi tiết Task 1 & Task 2 với gợi ý cải thiện và sample answers</p>
              <ul class="feature-list">
                <li>AI chấm đầy đủ tiêu chí</li>
                <li>Gợi ý cải thiện chi tiết</li>
                <li>Sample answers chất lượng</li>
              </ul>
            </div>

            <div class="feature-card">
              <div class="feature-icon">🎤</div>
              <h3>Speaking</h3>
              <p>AI chấm phát âm, ngữ pháp với thanh note-taking và gợi ý từ vựng</p>
              <ul class="feature-list">
                <li>AI chấm phát âm chi tiết</li>
                <li>Thanh note-taking thông minh</li>
                <li>Gợi ý từ vựng nâng cao</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <div class="stats-section">
        <div class="container">
          <h2 class="section-title">Thống kê học tập</h2>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-number">1,250+</div>
              <div class="stat-label">Bài tập đã hoàn thành</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">85%</div>
              <div class="stat-label">Tỷ lệ chính xác trung bình</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">7.5</div>
              <div class="stat-label">Điểm IELTS mục tiêu</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">30</div>
              <div class="stat-label">Ngày luyện tập liên tiếp</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      min-height: 100vh;
    }

    .hero-section {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 4rem 2rem;
      text-align: center;
    }

    .hero-content {
      max-width: 800px;
      margin: 0 auto;
    }

    .hero-title {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 1rem;
    }

    .hero-subtitle {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 600;
      text-decoration: none;
      display: inline-block;
      transition: all 0.3s;
    }

    .btn-large {
      padding: 1.2rem 2.5rem;
      font-size: 1.1rem;
    }

    .btn-primary {
      background-color: #28a745;
      color: white;
    }

    .btn-primary:hover {
      background-color: #218838;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background-color: transparent;
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background-color: white;
      color: #667eea;
    }

    .features-section {
      padding: 4rem 2rem;
      background-color: #f8f9fa;
    }

    .container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .section-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      color: #2c3e50;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 2rem;
    }

    .feature-card {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      text-align: center;
      transition: transform 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-5px);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #2c3e50;
    }

    .feature-card p {
      color: #666;
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .feature-list {
      text-align: left;
      list-style: none;
      padding: 0;
    }

    .feature-list li {
      padding: 0.5rem 0;
      color: #666;
      position: relative;
      padding-left: 1.5rem;
    }

    .feature-list li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #28a745;
      font-weight: bold;
    }

    .stats-section {
      padding: 4rem 2rem;
      background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
      color: white;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
    }

    .stat-item {
      text-align: center;
    }

    .stat-number {
      font-size: 3rem;
      font-weight: bold;
      color: #3498db;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 1.1rem;
      opacity: 0.9;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-actions {
        flex-direction: column;
        align-items: center;
      }

      .section-title {
        font-size: 2rem;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `]
})
export class HomeComponent {}
