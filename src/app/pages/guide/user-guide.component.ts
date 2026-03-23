import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-user-guide',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="guide-page">
      <div class="guide-container">
        <header class="guide-header">
          <h1>Hướng dẫn sử dụng</h1>
          <p>Làm quen với EssayRater – luyện viết IELTS Writing và nhận chấm điểm bằng AI</p>
        </header>

        <nav class="guide-toc">
          <h2>Mục lục</h2>
          <ul>
            <li><a (click)="scrollTo('overview')">Tổng quan</a></li>
            <li><a (click)="scrollTo('writing')">Luyện tập Writing</a></li>
            <li><a (click)="scrollTo('mock-test')">Mock test (Thi thử)</a></li>
            <li><a (click)="scrollTo('self-check')">Self-Check</a></li>
            <li><a (click)="scrollTo('history')">Lịch sử làm bài</a></li>
            <li><a (click)="scrollTo('support')">Hỗ trợ</a></li>
          </ul>
        </nav>

        <main class="guide-content">
          <section id="overview" class="guide-section">
            <h2>1. Tổng quan</h2>
            <p>EssayRater giúp bạn luyện viết IELTS Writing (Task 1 & Task 2), làm mock test có giới hạn thời gian và tự chấm bài bằng AI. Bạn có thể dùng không cần đăng nhập (giới hạn chấm miễn phí) hoặc đăng nhập bằng Google để lưu lịch sử và không giới hạn.</p>
          </section>

          <section id="writing" class="guide-section">
            <h2>2. Luyện tập Writing</h2>
            <p><strong>Trang chủ</strong> là danh sách bài tập Writing. Bạn có thể:</p>
            <ul>
              <li>Chọn <strong>Task 1</strong> hoặc <strong>Task 2</strong> từ menu (≡) hoặc lọc trên trang.</li>
              <li>Lọc theo độ khó (Dễ / Trung bình / Khó) và trạng thái (Đã làm / Chưa làm).</li>
              <li>Tìm kiếm theo tiêu đề hoặc nội dung đề.</li>
              <li>Click vào một bài để mở đề, viết bài trong ô soạn thảo và nộp bài.</li>
            </ul>
            <p>Sau khi nộp, hệ thống sẽ chấm bằng AI và hiển thị điểm cùng nhận xét. Bạn có thể xem lại bài và kết quả trong <strong>Lịch sử làm bài</strong> (cần đăng nhập).</p>
          </section>

          <section id="mock-test" class="guide-section">
            <h2>3. Mock test (Thi thử)</h2>
            <p>Mock test mô phỏng bài thi thật với <strong>timer nghiêm ngặt</strong>:</p>
            <ul>
              <li>Vào menu → <strong>Mock test (Thi thử)</strong> hoặc nút <strong>Mock test</strong> trên trang Writing.</li>
              <li>Chọn <strong>Bắt đầu Mock Test</strong> – bạn sẽ làm Task 1 (20 phút, 150 từ) và Task 2 (40 phút, 250 từ) liên tiếp.</li>
              <li>Hết giờ bài sẽ tự động nộp. Không có gợi ý hay hỗ trợ trong lúc làm.</li>
              <li>Sau khi hoàn thành, xem điểm và nhận xét chi tiết. Lịch sử mock test có tại <strong>Xem lịch sử Mock Test</strong>.</li>
            </ul>
          </section>

          <section id="self-check" class="guide-section">
            <h2>4. Self-Check (Tự chấm)</h2>
            <p>Nếu bạn đã viết bài trên giấy hoặc file khác, có thể dùng <strong>Writing Self-Check</strong>:</p>
            <ul>
              <li>Vào <strong>Writing Self-Check</strong> (từ menu hoặc link trong ứng dụng).</li>
              <li>Chọn loại bài (Task 1 / Task 2), nhập hoặc dán nội dung bài viết (có thể đính kèm ảnh đề nếu có).</li>
              <li>Gửi bài để nhận chấm điểm và nhận xét từ AI.</li>
            </ul>
          </section>

          <section id="history" class="guide-section">
            <h2>5. Lịch sử làm bài</h2>
            <p>Khi đã <strong>đăng nhập bằng Google</strong>:</p>
            <ul>
              <li><strong>Lịch sử làm bài</strong>: Xem tất cả bài đã làm (Writing thường + mock test), điểm số và nhận xét.</li>
              <li>Click vào từng bài để xem chi tiết đề, bài viết và bản chấm.</li>
            </ul>
            <p>Nếu chưa đăng nhập, bài làm trên phiên hiện tại sẽ không được lưu lâu dài.</p>
          </section>

          <section id="support" class="guide-section">
            <h2>6. Hỗ trợ</h2>
            <p>Trong menu <strong>Hỗ trợ</strong> bạn có thể tìm:</p>
            <ul>
              <li><strong>Nâng cấp tài khoản</strong> – thông tin gói premium (nếu có).</li>
              <li><strong>Câu hỏi thường gặp</strong> – FAQ.</li>
              <li><strong>Hướng dẫn sử dụng</strong> – trang này.</li>
              <li><strong>Liên hệ hỗ trợ</strong> – email, Facebook, Instagram, Telegram (nếu admin đã cấu hình).</li>
            </ul>
          </section>
        </main>

        <div class="guide-actions">
          <a routerLink="/writing" class="btn btn-primary">← Về trang Writing</a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guide-page {
      min-height: 100vh;
      background: #f1f5f9;
      padding: 2rem 1rem 4rem;
      padding-top: calc(70px + 2rem);
    }

    .guide-container {
      max-width: 800px;
      margin: 0 auto;
    }

    .guide-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }

    .guide-header h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .guide-header p {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0;
    }

    .guide-toc {
      background: white;
      border-radius: 0;
      padding: 1.25rem 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .guide-toc h2 {
      font-size: 1rem;
      font-weight: 600;
      color: #475569;
      margin: 0 0 0.75rem 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .guide-toc ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .guide-toc li {
      margin-bottom: 0.5rem;
    }

    .guide-toc a {
      color: #0d9488;
      text-decoration: none;
      font-weight: 500;
      cursor: pointer;
      display: inline-block;
      padding: 0.25rem 0;
    }

    .guide-toc a:hover {
      text-decoration: underline;
      color: #334155;
    }

    .guide-content {
      background: white;
      border-radius: 0;
      padding: 2rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .guide-section {
      margin-bottom: 2rem;
      scroll-margin-top: 90px;
    }

    .guide-section:last-child {
      margin-bottom: 0;
    }

    .guide-section h2 {
      font-size: 1.35rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 1rem 0;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .guide-section p {
      color: #475569;
      line-height: 1.65;
      margin: 0 0 0.75rem 0;
    }

    .guide-section ul {
      margin: 0 0 1rem 0;
      padding-left: 1.5rem;
      color: #475569;
      line-height: 1.7;
    }

    .guide-section li {
      margin-bottom: 0.5rem;
    }

    .guide-actions {
      margin-top: 2rem;
      text-align: center;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 0;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
    }

    .btn-primary {
      background: #0d9488;
      color: #fff;
    }

    .btn-primary:hover {
      background: #1e293b;
      color: #fff;
    }

    @media (max-width: 768px) {
      .guide-page {
        padding: 1rem;
        padding-top: calc(60px + 1rem);
      }

      .guide-header h1 {
        font-size: 1.5rem;
      }

      .guide-content {
        padding: 1.5rem;
      }
    }
  `]
})
export class UserGuideComponent {
  scrollTo(id: string): void {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
