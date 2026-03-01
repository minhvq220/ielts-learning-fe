import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-writing-mock-test-landing',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mock-test-landing">
      <div class="landing-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="hero-icon">🎯</div>
          <h1 class="hero-title">Mock Test - Thi thử nghiêm ngặt</h1>
          <p class="hero-subtitle">Trải nghiệm bài thi IELTS Writing giống như thi thật với timer nghiêm ngặt</p>
        </div>

        <!-- Features Section -->
        <div class="features-section">
          <div class="feature-card">
            <div class="feature-icon">⏱️</div>
            <h3>Timer nghiêm ngặt</h3>
            <p>Thời gian được tính chính xác, tự động nộp bài khi hết giờ</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🚫</div>
            <h3>Không có gợi ý</h3>
            <p>Làm bài hoàn toàn độc lập, không có hỗ trợ hay gợi ý nào</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">🤖</div>
            <h3>AI chấm điểm tự động</h3>
            <p>Nhận kết quả chấm điểm chi tiết ngay sau khi hoàn thành</p>
          </div>
          <div class="feature-card">
            <div class="feature-icon">📊</div>
            <h3>Phân tích chi tiết</h3>
            <p>Xem điểm số theo từng tiêu chí và nhận xét cụ thể</p>
          </div>
        </div>

        <!-- Test Info Section -->
        <div class="test-info-section">
          <h2>Thông tin bài thi</h2>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Thời gian:</span>
              <span class="info-value">60 phút</span>
            </div>
            <div class="info-item">
              <span class="info-label">Task 1:</span>
              <span class="info-value">20 phút (150 từ)</span>
            </div>
            <div class="info-item">
              <span class="info-label">Task 2:</span>
              <span class="info-value">40 phút (250 từ)</span>
            </div>
            <div class="info-item">
              <span class="info-label">Tổng điểm:</span>
              <span class="info-value">Trung bình của Task 1 và Task 2</span>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="action-section">
          <button class="btn btn-primary btn-start" (click)="startMockTest()">
            <span class="btn-icon">🚀</span>
            <span class="btn-text">Bắt đầu Mock Test</span>
          </button>
          <button class="btn btn-secondary btn-history" (click)="viewHistory()">
            <span class="btn-icon">📚</span>
            <span class="btn-text">Xem lịch sử Mock Test</span>
          </button>
        </div>

        <!-- Instructions Section -->
        <div class="instructions-section">
          <h2>Hướng dẫn</h2>
          <div class="instructions-list">
            <div class="instruction-item">
              <span class="instruction-number">1</span>
              <div class="instruction-content">
                <h4>Chuẩn bị</h4>
                <p>Đảm bảo bạn có đủ thời gian (60 phút) và môi trường yên tĩnh để làm bài</p>
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number">2</span>
              <div class="instruction-content">
                <h4>Làm bài</h4>
                <p>Đọc đề bài cẩn thận và viết bài hoàn chỉnh cho cả Task 1 và Task 2</p>
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number">3</span>
              <div class="instruction-content">
                <h4>Nộp bài</h4>
                <p>Click "Nộp bài thi" khi hoàn thành hoặc hệ thống sẽ tự động nộp khi hết giờ</p>
              </div>
            </div>
            <div class="instruction-item">
              <span class="instruction-number">4</span>
              <div class="instruction-content">
                <h4>Xem kết quả</h4>
                <p>Chờ AI chấm điểm và xem kết quả chi tiết cùng với nhận xét</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mock-test-landing {
      min-height: calc(100vh - 70px);
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 2rem 1rem;
    }

    .landing-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* Hero Section */
    .hero-section {
      text-align: center;
      color: white;
      padding: 3rem 1rem;
      margin-bottom: 3rem;
    }

    .hero-icon {
      font-size: 5rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-20px); }
    }

    .hero-title {
      font-size: 3rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
    }

    .hero-subtitle {
      font-size: 1.25rem;
      opacity: 0.95;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Features Section */
    .features-section {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 3rem;
    }

    .feature-card {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      transition: transform 0.3s, box-shadow 0.3s;
    }

    .feature-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 30px rgba(0,0,0,0.15);
    }

    .feature-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .feature-card h3 {
      margin: 0 0 0.75rem 0;
      color: #2c3e50;
      font-size: 1.25rem;
    }

    .feature-card p {
      margin: 0;
      color: #6c757d;
      line-height: 1.6;
    }

    /* Test Info Section */
    .test-info-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      margin-bottom: 3rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .test-info-section h2 {
      margin: 0 0 1.5rem 0;
      color: #2c3e50;
      text-align: center;
      font-size: 2rem;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .info-label {
      font-size: 0.9rem;
      color: #6c757d;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .info-value {
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 600;
    }

    /* Action Section */
    .action-section {
      display: flex;
      gap: 1.5rem;
      justify-content: center;
      margin-bottom: 3rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 1.25rem 2.5rem;
      border: none;
      border-radius: 12px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      min-width: 200px;
      justify-content: center;
    }

    .btn-primary {
      background: white;
      color: #667eea;
      box-shadow: 0 4px 15px rgba(255,255,255,0.3);
    }

    .btn-primary:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 25px rgba(255,255,255,0.4);
    }

    .btn-secondary {
      background: rgba(255,255,255,0.2);
      color: white;
      border: 2px solid white;
    }

    .btn-secondary:hover {
      background: rgba(255,255,255,0.3);
      transform: translateY(-3px);
    }

    .btn-icon {
      font-size: 1.5rem;
    }

    /* Instructions Section */
    .instructions-section {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .instructions-section h2 {
      margin: 0 0 2rem 0;
      color: #2c3e50;
      text-align: center;
      font-size: 2rem;
    }

    .instructions-list {
      display: grid;
      gap: 1.5rem;
    }

    .instruction-item {
      display: flex;
      gap: 1.5rem;
      align-items: flex-start;
    }

    .instruction-number {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1.2rem;
    }

    .instruction-content {
      flex: 1;
    }

    .instruction-content h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.1rem;
    }

    .instruction-content p {
      margin: 0;
      color: #6c757d;
      line-height: 1.6;
    }

    @media (max-width: 768px) {
      .hero-title {
        font-size: 2rem;
      }

      .hero-subtitle {
        font-size: 1rem;
      }

      .features-section {
        grid-template-columns: 1fr;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .action-section {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }

      .instruction-item {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class WritingMockTestLandingComponent {
  private router = inject(Router);

  startMockTest() {
    // Clear any old state and start fresh
    sessionStorage.removeItem('mock_test_result_state');
    sessionStorage.removeItem('coming_back_from_mock_test_detail');
    this.router.navigate(['/writing/mock-test/start']);
  }

  viewHistory() {
    this.router.navigate(['/writing/mock-test/history']);
  }
}

