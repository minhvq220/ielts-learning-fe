import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FeedbackService, FeedbackDto, FeedbackStatus, FeedbackType } from '../../services/feedback.service';

@Component({
  selector: 'app-admin-feedback',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-feedback">
      <div class="header">
        <h2>Quản lý Feedback</h2>
        <p>Theo dõi cảm nhận người dùng, trả lời và xử lý vấn đề nhanh chóng.</p>
      </div>

      <div class="filters">
        <select [(ngModel)]="statusFilter" (change)="load()">
          <option value="">Tất cả trạng thái</option>
          <option *ngFor="let s of statuses" [value]="s">{{ statusLabel(s) }}</option>
        </select>
        <select [(ngModel)]="typeFilter" (change)="load()">
          <option value="">Tất cả loại</option>
          <option *ngFor="let t of types" [value]="t">{{ typeLabel(t) }}</option>
        </select>
        <input [(ngModel)]="keyword" (keyup.enter)="load()" placeholder="Tìm theo tiêu đề/nội dung/email...">
        <button (click)="load()">Tìm</button>
      </div>

      <div class="list">
        <div *ngFor="let item of items()" class="card">
          <div class="top">
            <div>
              <strong>{{ item.title }}</strong>
              <div class="meta">{{ typeLabel(item.type) }} - {{ item.userEmail || item.userName || 'Ẩn danh' }}</div>
            </div>
            <span class="status" [class]="statusClass(item.status)">{{ statusLabel(item.status) }}</span>
          </div>

          <p class="content">{{ item.content }}</p>
          <p *ngIf="item.rating">Rating: {{ item.rating }}/5</p>

          <div class="reply" *ngIf="item.adminReply">
            <div class="reply-title">Phản hồi hiện tại</div>
            <p>{{ item.adminReply }}</p>
          </div>

          <div class="actions">
            <select #statusSelect>
              <option *ngFor="let s of statuses" [value]="s" [selected]="s === item.status">{{ statusLabel(s) }}</option>
            </select>
            <button (click)="updateStatus(item, statusSelect.value)">Cập nhật trạng thái</button>
          </div>

          <div class="reply-box">
            <textarea #replyText rows="3" placeholder="Nhập phản hồi cho người dùng..."></textarea>
            <button (click)="reply(item, replyText.value, statusSelect.value)">Gửi phản hồi</button>
          </div>
        </div>

        <p *ngIf="!items().length" class="empty">Chưa có feedback nào phù hợp bộ lọc.</p>
      </div>
    </div>
  `,
  styles: [`
    .admin-feedback { max-width: 1100px; margin: 0 auto; }
    .header h2 { margin: 0 0 0.5rem; color: #0f172a; }
    .header p { color: #64748b; margin: 0 0 1rem; }
    .filters { display: grid; grid-template-columns: 180px 180px 1fr auto; gap: 0.5rem; margin-bottom: 1rem; }
    .filters select, .filters input, .filters button { padding: 0.65rem; border: 1px solid #cbd5e1; }
    .filters button { background: #0d9488; color: #fff; border: none; font-weight: 700; }
    .card { background: #fff; border: 1px solid #e2e8f0; padding: 1rem; margin-bottom: 0.75rem; box-shadow: 0 2px 10px rgba(15, 23, 42, 0.05); }
    .top { display: flex; justify-content: space-between; gap: 1rem; }
    .meta { color: #64748b; font-size: 0.9rem; margin-top: 0.25rem; }
    .content { color: #334155; white-space: pre-wrap; }
    .status { padding: 0.2rem 0.5rem; font-size: 0.8rem; font-weight: 700; height: fit-content; }
    .status-open { background: #fef3c7; color: #92400e; }
    .status-review { background: #dbeafe; color: #1e3a8a; }
    .status-resolved { background: #dcfce7; color: #166534; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .reply { background: #f8fafc; border-left: 3px solid #0891b2; padding: 0.6rem; margin: 0.4rem 0; }
    .reply-title { font-weight: 700; color: #0f172a; }
    .actions { display: flex; gap: 0.5rem; margin: 0.65rem 0; }
    .actions select, .actions button { padding: 0.5rem; }
    .actions button, .reply-box button { background: #0284c7; color: white; border: none; cursor: pointer; }
    .reply-box textarea { width: 100%; box-sizing: border-box; padding: 0.6rem; border: 1px solid #cbd5e1; }
    .reply-box button { margin-top: 0.45rem; padding: 0.5rem 0.9rem; }
    .empty { color: #64748b; }
  `]
})
export class AdminFeedbackComponent implements OnInit {
  private feedbackService = inject(FeedbackService);

  items = signal<FeedbackDto[]>([]);
  statusFilter = '';
  typeFilter = '';
  keyword = '';

  statuses: FeedbackStatus[] = ['OPEN', 'IN_REVIEW', 'RESOLVED', 'REJECTED'];
  types: FeedbackType[] = ['GENERAL_FEEDBACK', 'BUG_REPORT', 'CONTENT_REPORT', 'FEATURE_REQUEST', 'RATING'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.feedbackService.getAdminFeedback({
      page: 0,
      size: 30,
      status: (this.statusFilter || undefined) as FeedbackStatus | undefined,
      type: (this.typeFilter || undefined) as FeedbackType | undefined,
      keyword: this.keyword || undefined
    }).subscribe({
      next: page => this.items.set(page.content),
      error: err => console.error('load admin feedback error', err)
    });
  }

  updateStatus(item: FeedbackDto, statusRaw: string): void {
    const status = statusRaw as FeedbackStatus;
    this.feedbackService.updateFeedbackStatus(item.id, status).subscribe({
      next: updated => {
        this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
      },
      error: err => console.error('update status error', err)
    });
  }

  reply(item: FeedbackDto, message: string, statusRaw: string): void {
    const adminReply = message.trim();
    if (!adminReply) return;
    const status = statusRaw as FeedbackStatus;
    this.feedbackService.replyFeedback(item.id, adminReply, status).subscribe({
      next: updated => {
        this.items.update(list => list.map(i => i.id === updated.id ? updated : i));
      },
      error: err => console.error('reply feedback error', err)
    });
  }

  typeLabel(type: FeedbackType): string {
    const map: Record<FeedbackType, string> = {
      GENERAL_FEEDBACK: 'Góp ý chung',
      BUG_REPORT: 'Báo lỗi',
      CONTENT_REPORT: 'Báo lỗi nội dung',
      FEATURE_REQUEST: 'Đề xuất tính năng',
      RATING: 'Đánh giá'
    };
    return map[type];
  }

  statusLabel(status: FeedbackStatus): string {
    const map: Record<FeedbackStatus, string> = {
      OPEN: 'Mới',
      IN_REVIEW: 'Đang xử lý',
      RESOLVED: 'Đã xử lý',
      REJECTED: 'Không hợp lệ'
    };
    return map[status];
  }

  statusClass(status: FeedbackStatus): string {
    if (status === 'OPEN') return 'status-open';
    if (status === 'IN_REVIEW') return 'status-review';
    if (status === 'RESOLVED') return 'status-resolved';
    return 'status-rejected';
  }
}
