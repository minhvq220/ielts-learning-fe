import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MarqueeAnnouncementsService,
  MarqueeLineAdmin,
  SiteMarqueeLineRequestBody,
} from '../../services/marquee-announcements.service';

@Component({
  selector: 'app-admin-marquee-lines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wrap">
      <div class="head">
        <h2>Thông báo chạy (header marquee)</h2>
      </div>

      <div *ngIf="loading()" class="loading">Đang tải...</div>

      <div *ngIf="!loading()" class="table-wrap">
        <table class="tbl">
          <thead>
            <tr>
              <th>Thứ tự</th>
              <th>Nội dung</th>
              <th>Bật</th>
              <th>Bắt đầu</th>
              <th>Kết thúc</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows()">
              <td>{{ row.sortOrder }}</td>
              <td class="msg">{{ row.message }}</td>
              <td>{{ row.enabled ? 'Có' : 'Không' }}</td>
              <td class="mono sm">{{ row.startsAt || '-' }}</td>
              <td class="mono sm">{{ row.endsAt || '-' }}</td>
              <td class="actions">
                <button type="button" class="btn-sm" (click)="startEdit(row)">Sửa</button>
                <button type="button" class="btn-del" (click)="remove(row)">Xóa</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="form-card">
        <h3>{{ editingId() != null ? 'Sửa dòng' : 'Thêm dòng mới' }}</h3>
        <div class="form-group">
          <label for="msg">Nội dung</label>
          <textarea id="msg" name="msg" rows="3" maxlength="500" [(ngModel)]="draft.message" class="inp"></textarea>
        </div>
        <div class="row2">
          <div class="form-group">
            <label for="en">Bật hiển thị</label>
            <input id="en" type="checkbox" [(ngModel)]="draft.enabled" name="en" />
          </div>
          <div class="form-group grow">
            <label for="so">Thứ tự</label>
            <input id="so" type="number" [(ngModel)]="draft.sortOrder" name="so" class="inp" />
          </div>
        </div>
        <div class="row2">
          <div class="form-group grow">
            <label for="st">Bắt đầu (tùy chọn)</label>
            <input id="st" type="datetime-local" [(ngModel)]="draft.startsAtLocal" name="st" class="inp" />
          </div>
          <div class="form-group grow">
            <label for="enAt">Kết thúc (tùy chọn)</label>
            <input id="enAt" type="datetime-local" [(ngModel)]="draft.endsAtLocal" name="enAt" class="inp" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn" [disabled]="saving() || !draft.message.trim()" (click)="save()">
            {{ saving() ? 'Đang lưu...' : editingId() != null ? 'Cập nhật' : 'Thêm mới' }}
          </button>
          <button type="button" class="btn-sec" *ngIf="editingId() != null" (click)="cancelEdit()" [disabled]="saving()">
            Hủy sửa
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .wrap { max-width: 960px; margin: 0 auto; padding: 1rem; }
    .head h2 { margin: 0 0 0.8rem; color: #0f172a; }
    .loading { padding: 1rem; color: #64748b; }
    .table-wrap { overflow-x: auto; margin-bottom: 1.5rem; }
    .tbl { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
    .tbl th, .tbl td { border: 1px solid #e2e8f0; padding: 0.5rem 0.6rem; text-align: left; vertical-align: top; }
    .tbl th { background: #f8fafc; font-weight: 600; color: #334155; }
    .msg { max-width: 360px; white-space: pre-wrap; word-break: break-word; }
    .mono { font-family: ui-monospace, monospace; }
    .sm { font-size: 0.8rem; }
    .actions { white-space: nowrap; }
    .btn-sm { padding: 0.35rem 0.6rem; margin-right: 0.35rem; background: #0d9488; color: #fff; border: none; cursor: pointer; font-size: 0.8rem; }
    .btn-del { padding: 0.35rem 0.6rem; background: #e11d48; color: #fff; border: none; cursor: pointer; font-size: 0.8rem; }
    .form-card { border: 1px solid #e2e8f0; padding: 1.25rem; background: #fff; }
    .form-card h3 { margin: 0 0 1rem; font-size: 1.1rem; color: #0f172a; }
    .form-group { margin-bottom: 1rem; }
    .form-group label { display: block; font-weight: 600; font-size: 0.85rem; color: #334155; margin-bottom: 0.35rem; }
    .inp { width: 100%; padding: 0.55rem 0.65rem; border: 1px solid #cbd5e1; box-sizing: border-box; font-family: inherit; }
    .row2 { display: flex; gap: 1rem; flex-wrap: wrap; align-items: flex-end; }
    .grow { flex: 1; min-width: 200px; }
    .form-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
    .btn { padding: 0.55rem 1rem; background: #0d9488; color: #fff; border: none; font-weight: 600; cursor: pointer; }
    .btn-sec { padding: 0.55rem 1rem; background: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; font-weight: 600; cursor: pointer; }
  `],
})
export class AdminMarqueeLinesComponent implements OnInit {
  private readonly api = inject(MarqueeAnnouncementsService);

  readonly rows = signal<MarqueeLineAdmin[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly editingId = signal<number | null>(null);

  draft = {
    message: '',
    enabled: true,
    sortOrder: null as number | null,
    startsAtLocal: '' as string,
    endsAtLocal: '' as string,
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listAdmin().subscribe({
      next: (list) => {
        this.rows.set(list ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.rows.set([]);
        this.loading.set(false);
      },
    });
  }

  startEdit(row: MarqueeLineAdmin): void {
    this.editingId.set(row.id);
    this.draft.message = row.message;
    this.draft.enabled = row.enabled;
    this.draft.sortOrder = row.sortOrder;
    this.draft.startsAtLocal = this.toDatetimeLocalValue(row.startsAt);
    this.draft.endsAtLocal = this.toDatetimeLocalValue(row.endsAt);
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.resetDraft();
  }

  private resetDraft(): void {
    this.draft.message = '';
    this.draft.enabled = true;
    this.draft.sortOrder = null;
    this.draft.startsAtLocal = '';
    this.draft.endsAtLocal = '';
  }

  save(): void {
    const msg = this.draft.message.trim();
    if (!msg) return;
    const body = this.buildBody(msg);
    this.saving.set(true);
    const id = this.editingId();
    const req =
      id != null ? this.api.updateAdmin(id, body) : this.api.createAdmin(body);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelEdit();
        this.load();
      },
      error: () => {
        this.saving.set(false);
      },
    });
  }

  remove(row: MarqueeLineAdmin): void {
    if (!confirm('Xóa dòng thông báo này?')) return;
    this.api.deleteAdmin(row.id).subscribe({
      next: () => {
        if (this.editingId() === row.id) this.cancelEdit();
        this.load();
      },
      error: () => {},
    });
  }

  private buildBody(message: string): SiteMarqueeLineRequestBody {
    const body: SiteMarqueeLineRequestBody = {
      message,
      enabled: this.draft.enabled,
    };
    if (this.draft.sortOrder != null && !Number.isNaN(Number(this.draft.sortOrder))) {
      body.sortOrder = Number(this.draft.sortOrder);
    }
    body.startsAt = this.fromDatetimeLocal(this.draft.startsAtLocal);
    body.endsAt = this.fromDatetimeLocal(this.draft.endsAtLocal);
    return body;
  }

  private toDatetimeLocalValue(iso: string | null | undefined): string {
    if (!iso) return '';
    const s = iso.replace(' ', 'T');
    if (s.length >= 16) return s.slice(0, 16);
    return s;
  }

  private fromDatetimeLocal(v: string): string | null {
    if (!v || !v.trim()) return null;
    if (v.length === 16) return v + ':00';
    return v;
  }
}
