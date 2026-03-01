import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ContactInfoService, ContactInfo } from '../../services/contact-info.service';

@Component({
  selector: 'app-admin-contact-info',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="contact-info-container">
      <div class="contact-info-header">
        <h2>Quản lý thông tin liên hệ</h2>
        <p>Cấu hình thông tin liên hệ hiển thị trong menu hỗ trợ</p>
      </div>

      <div *ngIf="loading()" class="loading">
        <div class="spinner"></div>
        <p>Đang tải thông tin...</p>
      </div>

      <form *ngIf="!loading()" (ngSubmit)="saveContactInfo()" class="contact-info-form">
        <div class="form-group">
          <label for="email">
            <span class="label-icon">📧</span>
            Email
          </label>
          <input
            type="email"
            id="email"
            [(ngModel)]="contactInfo.email"
            name="email"
            placeholder="support@example.com"
            class="form-input">
        </div>

        <div class="form-group">
          <label for="facebookUrl">
            <span class="label-icon">📘</span>
            Facebook URL
          </label>
          <input
            type="url"
            id="facebookUrl"
            [(ngModel)]="contactInfo.facebookUrl"
            name="facebookUrl"
            placeholder="https://facebook.com/yourpage"
            class="form-input">
        </div>

        <div class="form-group">
          <label for="instagramUrl">
            <span class="label-icon">📷</span>
            Instagram URL
          </label>
          <input
            type="url"
            id="instagramUrl"
            [(ngModel)]="contactInfo.instagramUrl"
            name="instagramUrl"
            placeholder="https://instagram.com/yourpage"
            class="form-input">
        </div>

        <div class="form-group">
          <label for="telegramUrl">
            <span class="label-icon">✈️</span>
            Telegram URL
          </label>
          <input
            type="url"
            id="telegramUrl"
            [(ngModel)]="contactInfo.telegramUrl"
            name="telegramUrl"
            placeholder="https://t.me/yourchannel"
            class="form-input">
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            <span *ngIf="!saving()">💾 Lưu thông tin</span>
            <span *ngIf="saving()">⏳ Đang lưu...</span>
          </button>
          <button type="button" class="btn btn-secondary" (click)="loadContactInfo()" [disabled]="saving()">
            🔄 Làm mới
          </button>
        </div>

        <div *ngIf="message()" class="message" [class.success]="success()" [class.error]="!success()">
          {{ message() }}
        </div>
      </form>
    </div>
  `,
  styles: [`
    .contact-info-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .contact-info-header {
      margin-bottom: 2rem;
    }

    .contact-info-header h2 {
      font-size: 2rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem 0;
    }

    .contact-info-header p {
      color: #64748b;
      margin: 0;
    }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #64748b;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .contact-info-form {
      background: white;
      border-radius: 12px;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.5rem;
      font-size: 0.95rem;
    }

    .label-icon {
      font-size: 1.2rem;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: #667eea;
    }

    .form-input::placeholder {
      color: #94a3b8;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 1px solid #e2e8f0;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
    }

    .btn-secondary {
      background: #f1f5f9;
      color: #475569;
      border: 2px solid #e2e8f0;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e2e8f0;
      border-color: #cbd5e1;
    }

    .message {
      margin-top: 1.5rem;
      padding: 1rem;
      border-radius: 8px;
      font-weight: 500;
    }

    .message.success {
      background: #d1fae5;
      color: #065f46;
      border: 1px solid #6ee7b7;
    }

    .message.error {
      background: #fee2e2;
      color: #991b1b;
      border: 1px solid #fca5a5;
    }

    @media (max-width: 768px) {
      .contact-info-container {
        padding: 1rem;
      }

      .contact-info-form {
        padding: 1.5rem;
      }

      .form-actions {
        flex-direction: column;
      }

      .btn {
        width: 100%;
      }
    }
  `]
})
export class AdminContactInfoComponent implements OnInit {
  private contactInfoService = inject(ContactInfoService);

  loading = signal(true);
  saving = signal(false);
  message = signal('');
  success = signal(false);
  contactInfo: ContactInfo = {
    email: '',
    facebookUrl: '',
    instagramUrl: '',
    telegramUrl: ''
  };

  ngOnInit(): void {
    this.loadContactInfo();
  }

  loadContactInfo(): void {
    this.loading.set(true);
    this.message.set('');
    
    this.contactInfoService.getContactInfoAdmin().subscribe({
      next: (info) => {
        this.contactInfo = { ...info };
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading contact info:', error);
        this.message.set('Không thể tải thông tin liên hệ. Vui lòng thử lại.');
        this.success.set(false);
        this.loading.set(false);
      }
    });
  }

  saveContactInfo(): void {
    this.saving.set(true);
    this.message.set('');

    this.contactInfoService.updateContactInfo(this.contactInfo).subscribe({
      next: (updated) => {
        this.contactInfo = { ...updated };
        this.message.set('Đã lưu thông tin liên hệ thành công!');
        this.success.set(true);
        this.saving.set(false);
        
        // Clear message after 3 seconds
        setTimeout(() => this.message.set(''), 3000);
      },
      error: (error) => {
        console.error('Error saving contact info:', error);
        this.message.set('Không thể lưu thông tin liên hệ. Vui lòng thử lại.');
        this.success.set(false);
        this.saving.set(false);
      }
    });
  }
}

