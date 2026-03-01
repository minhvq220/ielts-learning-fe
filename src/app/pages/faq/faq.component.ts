import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="faq-page">
      <div class="faq-container">
        <header class="faq-header">
          <h1>❓ Câu hỏi thường gặp</h1>
          <p>Giải đáp nhanh các thắc mắc về EssayRater</p>
        </header>

        <div class="faq-list">
          @for (item of faqItems; track item.id) {
            <div class="faq-item" [class.open]="openId() === item.id">
              <button
                type="button"
                class="faq-question"
                (click)="toggle(item.id)"
                [attr.aria-expanded]="openId() === item.id">
                <span class="faq-q-icon">{{ openId() === item.id ? '−' : '+' }}</span>
                <span class="faq-q-text">{{ item.question }}</span>
              </button>
              <div class="faq-answer" [class.open]="openId() === item.id">
                <div class="faq-answer-inner" [innerHTML]="item.answer"></div>
              </div>
            </div>
          }
        </div>

        <div class="faq-actions">
          <a routerLink="/writing" class="btn btn-primary">← Về trang Writing</a>
          <a routerLink="/guide" class="btn btn-secondary">📖 Xem hướng dẫn chi tiết</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .faq-page {
      min-height: 100vh;
      background: linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%);
      padding: 2rem 1rem 4rem;
      padding-top: calc(70px + 2rem);
    }

    .faq-container {
      max-width: 720px;
      margin: 0 auto;
    }

    .faq-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .faq-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .faq-header p {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
    }

    .faq-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .faq-item {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }

    .faq-question {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      text-align: left;
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      background: none;
      border: none;
      cursor: pointer;
      transition: background 0.2s;
    }

    .faq-question:hover {
      background: #f8fafc;
    }

    .faq-q-icon {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #667eea;
      color: white;
      border-radius: 6px;
      font-size: 1.1rem;
      line-height: 1;
      font-weight: 400;
    }

    .faq-q-text {
      flex: 1;
    }

    .faq-answer {
      max-height: 0;
      overflow: hidden;
      transition: max-height 0.3s ease;
    }

    .faq-answer.open {
      max-height: 500px;
    }

    .faq-answer-inner {
      padding: 0 1.25rem 1.25rem 3.5rem;
      color: #475569;
      line-height: 1.7;
      font-size: 0.95rem;
    }

    .faq-answer-inner p {
      margin: 0 0 0.5rem 0;
    }

    .faq-answer-inner p:last-child {
      margin-bottom: 0;
    }

    .faq-answer-inner ul {
      margin: 0.5rem 0 0 1rem;
      padding-left: 1rem;
    }

    .faq-answer-inner li {
      margin-bottom: 0.25rem;
    }

    .faq-actions {
      margin-top: 2.5rem;
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      justify-content: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.45);
    }

    .btn-secondary {
      background: white;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover {
      background: #f8fafc;
      border-color: #cbd5e1;
      color: #475569;
    }

    @media (max-width: 768px) {
      .faq-page {
        padding: 1rem;
        padding-top: calc(60px + 1rem);
      }

      .faq-header h1 {
        font-size: 1.5rem;
      }

      .faq-question {
        padding: 1rem;
      }

      .faq-answer-inner {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      .faq-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
        justify-content: center;
      }
    }
  `]
})
export class FaqComponent {
  openId = signal<string | null>(null);

  readonly faqItems: FaqItem[] = [
    {
      id: 'what-is',
      question: 'EssayRater là gì?',
      answer: `
        <p>EssayRater là ứng dụng giúp bạn luyện viết IELTS Writing (Task 1 và Task 2). Bạn làm bài theo đề có sẵn hoặc tự nhập bài viết, sau đó hệ thống chấm điểm và đưa nhận xét bằng AI. Bạn cũng có thể làm Mock Test với thời gian giới hạn giống bài thi thật.</p>
      `
    },
    {
      id: 'need-login',
      question: 'Tôi có bắt buộc phải đăng nhập không?',
      answer: `
        <p>Không bắt buộc. Bạn có thể luyện tập và nộp bài mà không cần đăng nhập. Tuy nhiên:</p>
        <ul>
          <li>Người dùng chưa đăng nhập có giới hạn số lần chấm bài miễn phí mỗi ngày.</li>
          <li>Đăng nhập bằng Google giúp lưu lịch sử làm bài, xem lại bài đã làm và không bị giới hạn chấm (tùy cấu hình hệ thống).</li>
        </ul>
      `
    },
    {
      id: 'how-score',
      question: 'Điểm số được chấm như thế nào?',
      answer: `
        <p>Hệ thống dùng AI (ví dụ mô hình ngôn ngữ) để chấm bài theo các tiêu chí tương tự IELTS: Task Achievement / Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy. Điểm tổng và điểm từng tiêu chí được hiển thị kèm nhận xét và gợi ý cải thiện.</p>
      `
    },
    {
      id: 'mock-test',
      question: 'Mock Test khác gì so với luyện tập thường?',
      answer: `
        <p>Mock Test mô phỏng bài thi thật:</p>
        <ul>
          <li>Có đồng hồ đếm thời gian nghiêm ngặt (Task 1: 20 phút, Task 2: 40 phút).</li>
          <li>Hết giờ bài sẽ tự động nộp, không có gợi ý hay hỗ trợ trong lúc làm.</li>
        </ul>
        <p>Luyện tập thường cho phép bạn làm bài thoải mái, không bị ép thời gian.</p>
      `
    },
    {
      id: 'self-check',
      question: 'Self-Check dùng để làm gì?',
      answer: `
        <p>Self-Check dành cho khi bạn đã viết bài trên giấy hoặc ở nơi khác. Bạn nhập hoặc dán nội dung bài viết (và có thể đính kèm ảnh đề bài nếu có), gửi lên để nhận chấm điểm và nhận xét từ AI mà không cần chọn đề từ danh sách Writing.</p>
      `
    },
    {
      id: 'history',
      question: 'Lịch sử làm bài lưu ở đâu?',
      answer: `
        <p>Khi đăng nhập bằng Google, mọi bài bạn đã làm (luyện tập thường và Mock Test) được lưu trên tài khoản. Bạn vào <strong>Lịch sử làm bài</strong> (từ menu hoặc nút trên trang Writing) để xem danh sách và mở từng bài xem lại đề, bài viết và kết quả chấm.</p>
      `
    },
    {
      id: 'contact',
      question: 'Liên hệ hỗ trợ ở đâu?',
      answer: `
        <p>Trong menu <strong>Hỗ trợ</strong> → <strong>Liên hệ hỗ trợ</strong>, bạn sẽ thấy thông tin email, Facebook, Instagram, Telegram (nếu admin đã cấu hình). Bạn cũng có thể xem thêm <strong>Hướng dẫn sử dụng</strong> trong cùng menu.</p>
      `
    }
  ];

  toggle(id: string): void {
    this.openId.update(current => (current === id ? null : id));
  }
}
