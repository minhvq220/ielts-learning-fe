import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ContactInfoService, ContactInfo } from '../../services/contact-info.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <footer class="footer">
      <div class="footer-inner">
        <!-- Logo + Slogan -->
        <div class="footer-brand">
          <a routerLink="/writing" class="footer-logo">EssayRater</a>
          <p class="footer-slogan">Luyện viết IELTS hiệu quả – Nhận phản hồi chi tiết theo tiêu chí chấm thi.</p>
        </div>

        <div class="footer-grid">
          <!-- Quick links -->
          <div class="footer-col">
            <h4 class="footer-title">Quick links</h4>
            <ul class="footer-links">
              <li><a routerLink="/writing">Luyện tập IELTS Writing</a></li>
              <li><a routerLink="/writing">Chấm điểm miễn phí</a></li>
              <li><a routerLink="/feedback">Góp ý & báo lỗi</a></li>
              <li class="footer-cta">Access detailed Writing feedback aligned with IELTS criteria.</li>
            </ul>
          </div>

          <!-- Liên hệ -->
          <div class="footer-col">
            <h4 class="footer-title">Liên hệ</h4>
            <ul class="footer-links">
              <li><a routerLink="/guide">About us</a></li>
              <li><a routerLink="/faq">Câu hỏi thường gặp</a></li>
              @if (contactInfo()?.email) {
                <li>
                  <a [href]="'mailto:' + contactInfo()!.email" target="_blank" rel="noopener">
                    {{ contactInfo()!.email }}
                  </a>
                </li>
              }
              @if (contactPhone()) {
                <li><a [href]="'tel:' + contactPhone()">{{ contactPhone() }}</a></li>
              }
            </ul>
          </div>

          <!-- Mạng xã hội -->
          <div class="footer-col">
            <h4 class="footer-title">Mạng xã hội</h4>
            <div class="footer-social">
              @if (contactInfo()?.facebookUrl) {
                <a [href]="contactInfo()!.facebookUrl" target="_blank" rel="noopener noreferrer" class="social-link" title="Facebook" aria-label="Facebook">
                  <span class="social-icon">f</span>
                </a>
              }
              @if (contactInfo()?.instagramUrl) {
                <a [href]="contactInfo()!.instagramUrl" target="_blank" rel="noopener noreferrer" class="social-link" title="Instagram" aria-label="Instagram">
                  <span class="social-icon">📷</span>
                </a>
              }
              @if (contactInfo()?.telegramUrl) {
                <a [href]="contactInfo()!.telegramUrl" target="_blank" rel="noopener noreferrer" class="social-link" title="Telegram" aria-label="Telegram">
                  <span class="social-icon">✈</span>
                </a>
              }
              @if (!hasAnySocial()) {
                <span class="footer-no-social">Chưa có liên kết mạng xã hội.</span>
              }
            </div>
          </div>
        </div>

        <div class="footer-bottom">
          <p class="footer-copy">&copy; {{ currentYear }} EssayRater. All rights reserved.</p>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      background: linear-gradient(135deg, #0d9488 0%, #0891b2 50%, #7c3aed 100%);
      color: #f1f5f9;
      padding: 2rem 1.25rem 1.15rem;
    }
    .footer-inner {
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer-brand {
      margin-bottom: 1.4rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    .footer-logo {
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      letter-spacing: -0.02em;
    }
    .footer-logo:hover {
      color: #bae6fd;
    }
    .footer-slogan {
      margin: 0.5rem 0 0;
      font-size: 0.84rem;
      color: #dbeafe;
      line-height: 1.45;
      max-width: 420px;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.35rem;
      margin-bottom: 1.35rem;
    }
    .footer-title {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #e2e8f0;
      margin: 0 0 0.7rem;
    }
    .footer-links {
      list-style: none;
      margin: 0;
      padding: 0;
    }
    .footer-links li {
      margin-bottom: 0.4rem;
    }
    .footer-links a {
      color: #f1f5f9;
      text-decoration: none;
      font-size: 0.88rem;
      text-underline-offset: 2px;
    }
    .footer-links a:hover {
      color: #fff;
      text-decoration: underline;
    }
    .footer-cta {
      font-size: 0.83rem;
      color: #e0f2fe;
      line-height: 1.4;
      font-style: italic;
      margin-top: 0.5rem;
    }
    .footer-social {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      align-items: center;
    }
    .social-link {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 36px;
      width: 36px;
      border-radius: 0;
      background: rgba(15, 23, 42, 0.28);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: #f8fafc;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .social-link:hover {
      background: rgba(15, 23, 42, 0.45);
      color: #fff;
    }
    .social-icon {
      font-size: 0.98rem;
    }
    .footer-no-social {
      font-size: 0.82rem;
      color: #e2e8f0;
    }
    .footer-bottom {
      padding-top: 1rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
    }
    .footer-copy {
      margin: 0;
      font-size: 0.78rem;
      color: #cbd5e1;
    }
    @media (max-width: 768px) {
      .footer { padding: 1.25rem 0.9rem 0.9rem; }
      .footer-grid { grid-template-columns: 1fr; gap: 1.1rem; }
      .footer-brand { margin-bottom: 1rem; }
    }
  `]
})
export class FooterComponent implements OnInit {
  contactInfo = signal<ContactInfo | null>(null);
  currentYear = new Date().getFullYear();

  constructor(private contactInfoService: ContactInfoService) {}

  ngOnInit(): void {
    this.contactInfoService.getContactInfo().subscribe(info => this.contactInfo.set(info));
  }

  contactPhone(): string | null {
    return null;
  }

  hasAnySocial(): boolean {
    const info = this.contactInfo();
    return !!(info?.facebookUrl || info?.instagramUrl || info?.telegramUrl);
  }
}
