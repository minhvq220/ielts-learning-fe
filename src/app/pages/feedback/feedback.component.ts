import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FeedbackService, FeedbackType, FeedbackStatus } from '../../services/feedback.service';
import { Page } from '../../models/page.model';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="feedback-page">
      <div class="feedback-main">
        <div class="feedback-card form-card">
          <h2>Đóng góp ý kiến</h2>
          <p class="intro">Chia sẻ nhanh góp ý, báo lỗi hoặc đề xuất tính năng.</p>

          <form [formGroup]="form" (ngSubmit)="submit()">
            <div class="meta-row">
              <div>
                <label>Loại phản hồi</label>
                <select formControlName="type" class="input">
                  <option *ngFor="let option of feedbackTypes" [value]="option.value">{{ option.label }}</option>
                </select>
              </div>
              <div>
                <label>Ngữ cảnh</label>
                <select formControlName="contextType" class="input">
                  <option value="SYSTEM">Hệ thống</option>
                  <option value="WRITING_TASK">Đề Writing</option>
                  <option value="WRITING_HISTORY">Bài đã nộp</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
            </div>

            <label>Tiêu đề</label>
            <input class="input" type="text" formControlName="title" placeholder="Ví dụ: Trang chấm điểm tải chậm">

            <label>Nội dung</label>
            <textarea class="input area" rows="5" formControlName="content" placeholder="Mô tả ngắn gọn vấn đề hoặc đề xuất..."></textarea>

            <div class="row" *ngIf="isRatingType()">
              <label>Đánh giá sao</label>
              <select formControlName="rating" class="input">
                <option [ngValue]="null">Chọn số sao</option>
                <option [ngValue]="5">5 - Rất hài lòng</option>
                <option [ngValue]="4">4 - Hài lòng</option>
                <option [ngValue]="3">3 - Bình thường</option>
                <option [ngValue]="2">2 - Chưa ổn</option>
                <option [ngValue]="1">1 - Cần cải thiện nhiều</option>
              </select>
            </div>

            <button class="btn-primary" type="submit" [disabled]="submitting() || form.invalid">
              {{ submitting() ? 'Đang gửi...' : 'Gửi phản hồi' }}
            </button>
          </form>

          <div class="message success" *ngIf="successMessage()">{{ successMessage() }}</div>
          <div class="message error" *ngIf="errorMessage()">{{ errorMessage() }}</div>
        </div>

        <div class="feedback-card history-card" *ngIf="authService.isAuthenticated()">
          <div class="history-header">
            <h3>Phản hồi của bạn</h3>
            <span class="history-count" *ngIf="myFeedback().totalElements">{{ myFeedback().totalElements }} mục</span>
          </div>
          <div class="history-list">
            <div class="history-item" *ngFor="let item of myFeedback().content">
              <div class="history-head">
                <strong>{{ item.title }}</strong>
                <span class="status" [class]="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
              </div>
              <p>{{ item.content }}</p>
              <div class="admin-reply" *ngIf="item.adminReply">
                <div class="admin-reply-title">Admin đã phản hồi</div>
                <p>{{ item.adminReply }}</p>
              </div>
            </div>
          </div>
          <p *ngIf="!myFeedback().content.length" class="muted">Bạn chưa gửi phản hồi nào.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .feedback-page { max-width: 1100px; margin: 1rem auto; padding: 1rem; }
    .feedback-main { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 1rem; align-items: start; }
    .feedback-card { background: #fff; border: 1px solid #e2e8f0; padding: 1rem; box-shadow: 0 3px 14px rgba(15, 23, 42, 0.05); }
    .form-card { min-height: 0; }
    .history-card { position: sticky; top: 86px; max-height: calc(100vh - 110px); overflow: hidden; display: flex; flex-direction: column; }
    h2, h3 { margin-top: 0; color: #0f172a; }
    h2 { font-size: 1.35rem; margin-bottom: 0.3rem; }
    h3 { font-size: 1.05rem; margin-bottom: 0; }
    .intro { color: #475569; margin-bottom: 0.8rem; font-size: 0.92rem; }
    .meta-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
    label { display: block; margin: 0.55rem 0 0.32rem; color: #334155; font-weight: 600; font-size: 0.88rem; }
    .input { width: 100%; padding: 0.58rem 0.65rem; border: 1px solid #cbd5e1; font-size: 0.9rem; box-sizing: border-box; }
    .input:focus { outline: none; border-color: #0891b2; box-shadow: 0 0 0 3px rgba(8, 145, 178, 0.15); }
    .area { resize: vertical; min-height: 100px; }
    .btn-primary { margin-top: 0.8rem; background: #0d9488; border: none; color: #fff; padding: 0.58rem 0.9rem; font-weight: 700; cursor: pointer; font-size: 0.9rem; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
    .message { margin-top: 0.65rem; padding: 0.62rem; font-size: 0.88rem; }
    .success { background: #dcfce7; color: #166534; }
    .error { background: #fee2e2; color: #991b1b; }
    .history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.6rem; }
    .history-count { color: #64748b; font-size: 0.82rem; }
    .history-list { overflow: auto; padding-right: 0.2rem; }
    .history-item { border: 1px solid #e2e8f0; padding: 0.62rem; margin-bottom: 0.6rem; }
    .history-head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    .history-item p { margin: 0.45rem 0 0; color: #334155; font-size: 0.88rem; line-height: 1.4; }
    .status { padding: 0.18rem 0.45rem; font-size: 0.74rem; font-weight: 700; white-space: nowrap; }
    .status-open { background: #fef3c7; color: #92400e; }
    .status-review { background: #dbeafe; color: #1e3a8a; }
    .status-resolved { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .admin-reply { margin-top: 0.52rem; background: #f8fafc; padding: 0.52rem; border-left: 3px solid #0891b2; }
    .admin-reply-title { font-weight: 700; color: #0f172a; margin-bottom: 0.2rem; font-size: 0.82rem; }
    .muted { color: #64748b; font-size: 0.88rem; }
    @media (max-width: 980px) {
      .feedback-main { grid-template-columns: 1fr; }
      .history-card { position: static; max-height: none; }
      .history-list { max-height: none; }
      .meta-row { grid-template-columns: 1fr; gap: 0.2rem; }
    }
  `]
})
export class FeedbackComponent implements OnInit {
  private fb = inject(FormBuilder);
  private feedbackService = inject(FeedbackService);
  authService = inject(AuthService);

  submitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  myFeedback = signal<Page<any>>({ content: [], pageable: { pageNumber: 0, pageSize: 10, sort: { sorted: false, unsorted: true, empty: true }, offset: 0, paged: true, unpaged: false }, totalElements: 0, totalPages: 0, last: true, first: true, numberOfElements: 0, size: 10, number: 0, sort: { sorted: false, unsorted: true, empty: true }, empty: true });

  feedbackTypes = [
    { value: 'GENERAL_FEEDBACK', label: 'Góp ý chung' },
    { value: 'BUG_REPORT', label: 'Báo lỗi' },
    { value: 'CONTENT_REPORT', label: 'Báo lỗi nội dung bài viết/đề' },
    { value: 'FEATURE_REQUEST', label: 'Đề xuất tính năng mới' },
    { value: 'RATING', label: 'Đánh giá hệ thống' }
  ];

  form = this.fb.group({
    type: ['GENERAL_FEEDBACK' as FeedbackType, Validators.required],
    contextType: ['SYSTEM', Validators.required],
    title: ['', [Validators.required, Validators.maxLength(255)]],
    content: ['', [Validators.required, Validators.maxLength(5000)]],
    rating: [null as number | null],
    contactEmail: ['']
  });

  isRatingType = computed(() => this.form.get('type')?.value === 'RATING');

  ngOnInit(): void {
    this.form.get('type')?.valueChanges.subscribe(value => {
      const ratingControl = this.form.get('rating');
      if (value === 'RATING') {
        ratingControl?.setValidators([Validators.required, Validators.min(1), Validators.max(5)]);
      } else {
        ratingControl?.clearValidators();
        ratingControl?.setValue(null);
      }
      ratingControl?.updateValueAndValidity();
    });

    this.loadMyFeedback();
  }

  submit(): void {
    if (this.form.invalid) return;
    this.submitting.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    const payload = this.form.value;
    this.feedbackService.createFeedback({
      type: payload.type as FeedbackType,
      contextType: payload.contextType as any,
      title: payload.title?.trim() || '',
      content: payload.content?.trim() || '',
      rating: payload.rating ?? null,
      contactEmail: payload.contactEmail?.trim() || null
    }).subscribe({
      next: () => {
        this.successMessage.set('Cảm ơn bạn! Phản hồi đã được gửi thành công.');
        this.submitting.set(false);
        this.form.patchValue({ title: '', content: '', rating: null, contactEmail: '' });
        if (this.authService.isAuthenticated()) this.loadMyFeedback();
      },
      error: (err) => {
        console.error(err);
        this.errorMessage.set('Không thể gửi phản hồi lúc này. Vui lòng thử lại.');
        this.submitting.set(false);
      }
    });
  }

  loadMyFeedback(): void {
    this.feedbackService.getMyFeedback(0, 10).subscribe({
      next: page => this.myFeedback.set(page),
      error: err => console.error('loadMyFeedback error', err)
    });
  }

  statusLabel(status: FeedbackStatus): string {
    switch (status) {
      case 'OPEN': return 'Mới';
      case 'IN_REVIEW': return 'Đang xử lý';
      case 'RESOLVED': return 'Đã xử lý';
      case 'REJECTED': return 'Không hợp lệ';
      default: return status;
    }
  }

  statusClass(status: FeedbackStatus): string {
    if (status === 'OPEN') return 'status-open';
    if (status === 'IN_REVIEW') return 'status-review';
    if (status === 'RESOLVED') return 'status-resolved';
    return 'status-rejected';
  }
}
