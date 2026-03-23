import { Component, signal, computed, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WritingHistoryApiService, WritingHistoryDto, Page } from '../../services/writing-history-api.service';
import { WritingTaskService } from '../../services/writing-task.service';
import { WritingTask } from '../../models/writing-task.model';
import { AuthService } from '../../services/auth.service';
import { AppConfig } from '../../config/app.config';
import flatpickr from 'flatpickr';

interface AdminWritingHistoryDto extends WritingHistoryDto {
  userName?: string;
  userEmail?: string;
}

@Component({
  selector: 'app-admin-writing-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Lịch sử làm bài Writing (Admin)</h2>
        <p>Xem tất cả các bài viết của người dùng</p>
      </div>

      <div class="filters-section">
        <!-- Search Box -->
        <div class="filter-group search-group">
          <label>⌕ Tìm kiếm:</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="triggerSearch()"
              (input)="onSearchChange()"
              placeholder="Tìm theo nội dung bài viết, tiêu đề đề bài, user..."
              class="search-input">
            <button class="btn btn-primary btn-search" (click)="triggerSearch()" type="button">
              ⌕ Tìm kiếm
            </button>
          </div>
        </div>
        
        <div class="filter-group">
          <label>Loại bài:</label>
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">Tất cả</option>
            <option value="TASK1">Task 1</option>
            <option value="TASK2">Task 2</option>
          </select>
        </div>
        
        <!-- Date Filters -->
        <div class="filter-group">
          <label>📅 Ngày làm bài:</label>
          <input 
            #fromDateInput
            type="text" 
            [(ngModel)]="fromDate" 
            placeholder="dd/mm/yyyy"
            class="date-input">
          <span class="date-separator">đến</span>
          <input 
            #toDateInput
            type="text" 
            [(ngModel)]="toDate" 
            placeholder="dd/mm/yyyy"
            class="date-input">
        </div>
        
        <div class="filter-group">
          <button class="btn btn-secondary btn-clear" (click)="clearFilters()">Xóa bộ lọc</button>
        </div>
      </div>

      <div class="history-list">
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Đang tải lịch sử...</p>
        </div>

        <div *ngIf="!loading() && historyPage() && historyPage()!.content.length === 0" class="empty-state">
          <div class="empty-icon">≡</div>
          <h3>Không tìm thấy bài viết nào</h3>
          <p *ngIf="hasActiveFilters()">Không có kết quả phù hợp với bộ lọc. Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem tất cả.</p>
          <p *ngIf="!hasActiveFilters()">Chưa có bài viết nào.</p>
        </div>

        <div *ngFor="let item of historyPage()?.content || []" class="history-item">
          <div class="history-card">
            <div class="history-card-header">
              <div class="title-block">
                <h3 class="task-title">{{ item.taskTitle || ('Bài Task ' + item.taskId) }}</h3>
                <div class="user-info">
                  <span class="user-label">Người làm bài:</span>
                  <span *ngIf="getUserName(item) || getUserEmail(item)" class="user-details">
                    <span *ngIf="getUserName(item)" class="user-name">{{ getUserName(item) }}</span>
                    <span *ngIf="getUserName(item) && getUserEmail(item)" class="user-separator"> · </span>
                    <span *ngIf="getUserEmail(item)" class="user-email">{{ getUserEmail(item) }}</span>
                  </span>
                  <span *ngIf="!getUserName(item) && !getUserEmail(item)" class="user-details">
                    <span class="user-id">ID: {{ item.userId }}</span>
                    <span class="anonymous-badge">(Anonymous)</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="history-card-body">
              <div class="task-instruction-preview" *ngIf="getTaskInstruction(item)">
                <h4>Đề bài</h4>
                <div class="instruction-text" [innerHTML]="sanitizeHtml(getTaskInstruction(item))"></div>
              </div>
              
              <div class="answer-preview">
                <h4>Bài viết</h4>
                <div class="answer-text" [innerHTML]="sanitizeHtml(getAnswerPreview(item.answer))"></div>
              </div>

              <!-- All chips in one line -->
              <div class="all-chips">
                <span class="chip task-type-badge" [ngClass]="item.taskType.toLowerCase()">
                  {{ item.taskType === 'TASK1' ? 'Task 1' : 'Task 2' }}
                </span>
                <span class="chip subtype-chip" *ngIf="getTaskSubtypeLabel(item)">
                  {{ getTaskSubtypeLabel(item) }}
                </span>
                <span
                  class="chip difficulty-badge"
                  *ngIf="getTaskDifficulty(item) as difficulty"
                  [ngClass]="difficulty">
                  {{ getDifficultyLabel(difficulty) }}
                </span>
                <span class="chip meta-chip" *ngIf="getTaskTimeLimit(item) as timeLimit">
                  <span class="chip-icon">⏱</span>Giới hạn: {{ timeLimit }} phút
                </span>
                <span class="chip meta-chip" *ngIf="getTaskWordTarget(item) as wordTarget">
                  <span class="chip-icon">✎</span>Mục tiêu: {{ wordTarget }} từ
                </span>
                <span class="chip meta-chip">
                  <span class="chip-icon">✎</span>{{ item.wordCount }} từ thực tế
                </span>
                <span class="chip meta-chip">
                  <span class="chip-icon">⏱</span>Đã làm: {{ formatDuration(item.timeSpent) }}
                </span>
                <span class="chip meta-chip">
                  <span class="chip-icon">·</span>{{ formatDate(item.submittedAt) }} {{ formatTime(item.submittedAt) }}
                </span>
                <span class="chip meta-chip score-chip" *ngIf="item.aiScore">
                  <span class="chip-icon">◎</span>{{ item.aiScore.toFixed(1) }}/9
                </span>
              </div>

              <div class="evaluation-results" *ngIf="item.aiScore">
                <div class="evaluation-header">
                  <h4>Điểm chi tiết</h4>
                  <span class="overall-score-chip">{{ item.aiScore.toFixed(1) }}/9</span>
                </div>
                <div class="criteria-grid">
                  <div class="criteria-item" *ngIf="item.taskAchievement">
                    <span class="criteria-name">Task Achievement</span>
                    <span class="criteria-value">{{ item.taskAchievement.toFixed(1) }}/9</span>
                    <div class="criteria-track">
                      <div class="criteria-fill" [style.width.%]="(item.taskAchievement / 9) * 100"></div>
                    </div>
                  </div>
                  <div class="criteria-item" *ngIf="item.coherenceCohesion">
                    <span class="criteria-name">Coherence & Cohesion</span>
                    <span class="criteria-value">{{ item.coherenceCohesion.toFixed(1) }}/9</span>
                    <div class="criteria-track">
                      <div class="criteria-fill" [style.width.%]="(item.coherenceCohesion / 9) * 100"></div>
                    </div>
                  </div>
                  <div class="criteria-item" *ngIf="item.lexicalResource">
                    <span class="criteria-name">Lexical Resource</span>
                    <span class="criteria-value">{{ item.lexicalResource.toFixed(1) }}/9</span>
                    <div class="criteria-track">
                      <div class="criteria-fill" [style.width.%]="(item.lexicalResource / 9) * 100"></div>
                    </div>
                  </div>
                  <div class="criteria-item" *ngIf="item.grammaticalRange">
                    <span class="criteria-name">Grammatical Range</span>
                    <span class="criteria-value">{{ item.grammaticalRange.toFixed(1) }}/9</span>
                    <div class="criteria-track">
                      <div class="criteria-fill" [style.width.%]="(item.grammaticalRange / 9) * 100"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="history-actions">
                <button class="btn btn-primary" (click)="viewFullAnswer(item)">Xem chi tiết</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="history-pagination" *ngIf="historyPage() && historyPage()!.totalPages > 1">
        <button
          class="btn btn-sm"
          [disabled]="historyPage() && historyPage()!.first"
          (click)="goToPage((historyPage()?.number || 0))">
          ← Trước
        </button>

        <div class="page-numbers">
          <button
            *ngFor="let page of getPageNumbers()"
            class="btn btn-sm page-btn"
            [class.active]="page === (historyPage()?.number || 0) + 1"
            (click)="goToPage(page - 1)">
            {{ page }}
          </button>
        </div>

        <button
          class="btn btn-sm"
          [disabled]="historyPage() && historyPage()!.last"
          (click)="goToPage((historyPage()?.number || 0) + 2)">
          Sau →
        </button>
        
        <div class="pagination-info" *ngIf="historyPage()">
          Trang {{ (historyPage()!.number || 0) + 1 }} / {{ historyPage()!.totalPages }} 
          (Tổng: {{ historyPage()!.totalElements }} bài)
        </div>
      </div>
    </div>
  `,
  styles: [`
    .history-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem;
    }

    .history-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .history-header h2 {
      color: #1f2937;
      margin-bottom: 0.5rem;
      font-size: 2rem;
      font-weight: 700;
    }

    .history-header p {
      color: #6b7280;
      font-size: 1rem;
    }

    .filters-section {
      background: #ffffff;
      padding: 1rem 1.25rem;
      border-radius: 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      margin-bottom: 1.5rem;
      display: flex;
      gap: 1.25rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
    }

    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0;
      background: white;
    }

    .search-group {
      flex: 1;
      min-width: 250px;
    }

    .search-input-wrapper {
      display: flex;
      gap: 0.5rem;
      width: 100%;
      align-items: center;
    }

    .search-input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0;
      font-size: 0.9rem;
    }

    .btn-search,
    .btn-apply {
      padding: 0.5rem 1rem;
      white-space: nowrap;
      font-size: 0.9rem;
      background: #0d9488;
      color: white;
      border: none;
      border-radius: 0;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-search:hover,
    .btn-apply:hover {
      background: #1e293b;
    }

    .date-input {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0;
      font-size: 0.85rem;
    }

    .date-separator {
      margin: 0 0.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .btn-clear {
      padding: 0.5rem 1rem;
    }

    .pagination-info {
      margin-left: 1rem;
      color: #6b7280;
      font-size: 0.875rem;
      display: flex;
      align-items: center;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .history-item {
      list-style: none;
    }

    .history-card {
      background: #ffffff;
      border-radius: 0;
      border: 1px solid #e2e8f0;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.08);
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .history-card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 1rem;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 0.75rem;
    }

    .title-block {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .task-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #0d9488;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
      font-size: 0.875rem;
    }

    .user-label {
      font-weight: 600;
      color: #475569;
    }

    .user-details {
      color: #1f2937;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .user-name {
      font-weight: 500;
      color: #0f766e;
    }

    .user-email {
      color: #6b7280;
    }

    .user-separator {
      color: #9ca3af;
    }

    .user-id {
      font-family: monospace;
      font-size: 0.8rem;
      color: #6b7280;
      background: #f1f5f9;
      padding: 0.2rem 0.4rem;
      border-radius: 0;
    }

    .anonymous-badge {
      color: #9ca3af;
      font-size: 0.8rem;
      font-style: italic;
    }

    .all-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin-top: 0.75rem;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.65rem;
      border-radius: 0;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #1f2937;
      line-height: 1;
      white-space: nowrap;
    }

    .chip-icon {
      font-size: 0.85rem;
    }

    .task-type-badge.task1 {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .task-type-badge.task2 {
      background: #fee2e2;
      color: #b91c1c;
    }

    .subtype-chip {
      background: #e2e8f0;
      color: #334155;
    }

    .difficulty-badge.easy {
      background: #dcfce7;
      color: #166534;
    }

    .difficulty-badge.medium {
      background: #fef3c7;
      color: #b45309;
    }

    .difficulty-badge.hard {
      background: #fee2e2;
      color: #b91c1c;
    }

    .meta-chip {
      background: #f8fafc;
      color: #334155;
    }

    .score-chip {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 600;
    }

    .history-card-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-instruction-preview,
    .answer-preview {
      margin-bottom: 0.5rem;
    }

    .task-instruction-preview h4,
    .answer-preview h4 {
      margin: 0 0 0.5rem 0;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .instruction-text,
    .answer-text {
      background: #f8fafc;
      padding: 0.85rem;
      border-radius: 0;
      border: 1px solid #e2e8f0;
      color: #1f2937;
      font-size: 0.875rem;
      line-height: 1.5;
      max-height: 140px;
      overflow: hidden;
    }

    .evaluation-results {
      border-top: 1px dashed #cbd5e1;
      padding-top: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.5rem;
    }

    .evaluation-header h4 {
      margin: 0;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
    }

    .overall-score-chip {
      background: #312e81;
      color: #f8fafc;
      padding: 0.35rem 0.7rem;
      border-radius: 0;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .criteria-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
    }

    .criteria-item {
      flex: 1 1 180px;
      background: #f1f5f9;
      border: 1px solid #e2e8f0;
      border-radius: 0;
      padding: 0.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .criteria-name {
      font-size: 0.75rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .criteria-value {
      font-size: 0.9rem;
      font-weight: 600;
      color: #1f2937;
    }

    .criteria-track {
      height: 6px;
      background: #e2e8f0;
      border-radius: 0;
      overflow: hidden;
    }

    .criteria-fill {
      height: 100%;
      background: #0d9488;
    }

    .history-actions {
      display: flex;
      gap: 0.6rem;
      justify-content: flex-end;
      border-top: 1px solid #e2e8f0;
      padding-top: 0.75rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.45rem 0.9rem;
      border: none;
      border-radius: 0;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-sm {
      padding: 0.4rem 0.75rem;
      font-size: 0.825rem;
    }

    .btn-primary {
      background: #0f766e;
      color: white;
    }

    .btn-primary:hover {
      background: #1d4ed8;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #1f2937;
    }

    .btn-secondary:hover {
      background: #cbd5f5;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #e5e7eb;
      border-top: 4px solid #0d9488;
      border-radius: 0;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #6b7280;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #374151;
    }

    .empty-state p {
      margin: 0;
    }

    .history-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 0.75rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .page-btn {
      background: #f1f5f9;
      color: #1f2937;
    }

    .page-btn.active {
      background: #0d9488;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
    }

    @media (max-width: 768px) {
      .history-container {
        padding: 1rem;
      }

      .filters-section {
        flex-direction: column;
        align-items: stretch;
      }

      .search-input-wrapper {
        flex-direction: column;
        gap: 0.75rem;
      }

      .btn-search,
      .btn-apply {
        width: 100%;
      }

      .history-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .history-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AdminWritingHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private writingTaskService = inject(WritingTaskService);
  private sanitizer = inject(DomSanitizer);

  selectedType = '';
  searchQuery = '';
  fromDate = '';
  toDate = '';
  
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;
  
  private fromDatePicker: flatpickr.Instance | null = null;
  private toDatePicker: flatpickr.Instance | null = null;
  
  currentPage = signal(0);
  itemsPerPage = 10;
  searchDebounceTimer: any = null;

  historyPage = signal<Page<AdminWritingHistoryDto> | null>(null);
  loading = signal(false);

  ngOnInit() {
    this.loadHistory();
  }

  ngAfterViewInit() {
    if (this.fromDateInput) {
      this.fromDatePicker = flatpickr(this.fromDateInput.nativeElement, {
        dateFormat: 'd/m/Y',
        locale: {
          firstDayOfWeek: 1
        },
        onChange: (selectedDates, dateStr) => {
          this.fromDate = dateStr;
        }
      });
    }

    if (this.toDateInput) {
      this.toDatePicker = flatpickr(this.toDateInput.nativeElement, {
        dateFormat: 'd/m/Y',
        locale: {
          firstDayOfWeek: 1
        },
        onChange: (selectedDates, dateStr) => {
          this.toDate = dateStr;
        }
      });
    }
  }

  ngOnDestroy() {
    if (this.fromDatePicker) {
      this.fromDatePicker.destroy();
    }
    if (this.toDatePicker) {
      this.toDatePicker.destroy();
    }
  }

  loadHistory() {
    this.loading.set(true);
    
    const fromDateParam = this.fromDate ? this.convertDateFormat(this.fromDate, true) : undefined;
    const toDateParam = this.toDate ? this.convertDateFormat(this.toDate, false) : undefined;

    let params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('size', this.itemsPerPage.toString());

    if (this.searchQuery) {
      params = params.set('search', this.searchQuery);
    }
    if (this.selectedType) {
      params = params.set('taskType', this.selectedType);
    }
    if (fromDateParam) {
      params = params.set('fromDate', fromDateParam);
    }
    if (toDateParam) {
      params = params.set('toDate', toDateParam);
    }

    // Use admin endpoint
    this.http.get<Page<AdminWritingHistoryDto>>(`${AppConfig.api.baseUrl}/api/admin/writing-history/history`, { params }).subscribe({
      next: (page) => {
        this.historyPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('Admin endpoint not available, trying alternative:', err);
        // Alternative: try different endpoint pattern
        this.http.get<Page<AdminWritingHistoryDto>>(`${AppConfig.api.baseUrl}/api/writing-history/all/page`, { params }).subscribe({
          next: (page) => {
            this.historyPage.set(page);
            this.loading.set(false);
          },
          error: (fallbackErr) => {
            console.error('Error loading history. Please create admin endpoint:', fallbackErr);
            this.loading.set(false);
          }
        });
      }
    });
  }

  hasActiveFilters(): boolean {
    return !!(
      this.searchQuery || 
      this.selectedType || 
      this.fromDate || 
      this.toDate
    );
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedType = '';
    this.fromDate = '';
    this.toDate = '';
    this.currentPage.set(0);
    this.loadHistory();
  }

  onFilterChange() {
    this.currentPage.set(0);
    this.loadHistory();
  }

  onSearchChange() {
    // Can add debounce here if needed
  }

  triggerSearch() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.currentPage.set(0);
    this.loadHistory();
  }

  viewFullAnswer(item: AdminWritingHistoryDto): void {
    this.router.navigate(['/admin/writing-history', item.id]);
  }

  goToPage(page: number): void {
    if (page < 0) {
      page = 0;
    }
    const totalPages = this.historyPage()?.totalPages || 0;
    if (totalPages > 0 && page >= totalPages) {
      page = totalPages - 1;
    }
    this.currentPage.set(page);
    this.loadHistory();
  }

  getPageNumbers(): number[] {
    const totalPages = this.historyPage()?.totalPages || 0;
    if (totalPages <= 0) {
      return [];
    }
    const current = (this.historyPage()?.number || 0) + 1;
    const pages: number[] = [];
    
    let start = Math.max(1, current - 3);
    let end = Math.min(totalPages, current + 3);
    
    if (end - start < 6) {
      if (start === 1) {
        end = Math.min(totalPages, start + 6);
      } else {
        start = Math.max(1, end - 6);
      }
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  private findTask(item: WritingHistoryDto): WritingTask | undefined {
    return this.writingTaskService.sortedTasks().find((t: WritingTask) => t.id === item.taskId.toString());
  }

  getTaskSubtypeLabel(item: WritingHistoryDto): string | null {
    const task = this.findTask(item);
    if (!task) {
      return null;
    }

    if (task.type === 'task1') {
      const labels: Record<string, string> = {
        'line-graph': 'Line Graph',
        'bar-chart': 'Bar Chart',
        'pie-chart': 'Pie Chart',
        'table': 'Table',
        'mixed-graph': 'Mixed Graph',
        'map': 'Map',
        'process': 'Process'
      };
      return labels[task.task1Type] || null;
    }

    if (task.type === 'task2') {
      const labels: Record<string, string> = {
        'agree-disagree': 'Agree/Disagree',
        'discussion': 'Discussion',
        'advantages-disadvantages': 'Advantages/Disadvantages',
        'causes-problems-solutions': 'Causes/Problems/Solutions',
        'two-part-question': 'Two-Part Question',
        'positive-negative-development': 'Positive/Negative Development'
      };
      return labels[task.task2Type] || null;
    }

    return null;
  }

  getTaskDifficulty(item: WritingHistoryDto): 'easy' | 'medium' | 'hard' | null {
    const task = this.findTask(item);
    return task ? task.difficulty : null;
  }

  getDifficultyLabel(difficulty: 'easy' | 'medium' | 'hard'): string {
    const labels: Record<'easy' | 'medium' | 'hard', string> = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó'
    };
    return labels[difficulty];
  }

  getTaskTimeLimit(item: WritingHistoryDto): number | null {
    const task = this.findTask(item);
    return task ? task.timeLimit : null;
  }

  getTaskWordTarget(item: WritingHistoryDto): number | null {
    const task = this.findTask(item);
    return task ? task.wordCount : null;
  }

  getTaskInstruction(item: WritingHistoryDto): string | null {
    const task = this.findTask(item);
    return task?.instruction || null;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  convertDateFormat(dateStr: string, isStart: boolean): string {
    const dateRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
    if (!dateRegex.test(dateStr)) {
      return '';
    }

    const [, day, month, year] = dateStr.match(dateRegex)!;
    const date = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
    
    if (isStart) {
      date.setHours(0, 0, 0, 0);
    } else {
      date.setHours(23, 59, 59, 999);
    }

    return date.toISOString();
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  getAnswerPreview(answer: string): string {
    if (!answer) return '';
    return answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
  }

  getUserName(item: WritingHistoryDto): string | undefined {
    return (item as AdminWritingHistoryDto).userName;
  }

  getUserEmail(item: WritingHistoryDto): string | undefined {
    return (item as AdminWritingHistoryDto).userEmail;
  }

  /**
   * Sanitize HTML content to prevent XSS attacks
   */
  sanitizeHtml(html: string | null | undefined): SafeHtml {
    if (!html) {
      return this.sanitizer.sanitize(1, '') as SafeHtml; // SecurityContext.HTML = 1
    }
    return this.sanitizer.sanitize(1, html) as SafeHtml;
  }
}
