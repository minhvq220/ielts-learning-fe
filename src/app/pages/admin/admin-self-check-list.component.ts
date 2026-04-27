import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AuthService } from '../../services/auth.service';
import { AiCorrection, WritingStatistics, DetailedIeltsScores } from '../../services/writing-history-api.service';
import { AppConfig } from '../../config/app.config';

interface WritingSelfCheckHistoryDto {
  id: number;
  userId: string;
  userName?: string; // User's name (for admin view)
  userEmail?: string; // User's email (for admin view)
  taskType: string;
  taskQuestion: string;
  userAnswer: string;
  wordCount: number;
  imageData?: string;
  imageMimeType?: string;
  imageUrl?: string;
  aiScore?: number;
  taskAchievement?: number;
  coherenceCohesion?: number;
  lexicalResource?: number;
  grammaticalRange?: number;
  aiFeedback?: string;
  aiSuggestions?: string[];
  aiCorrections?: AiCorrection[];
  aiCorrectedAnswer?: string;
  aiProvider?: string;
  aiModel?: string;
  aiEvaluatedAt?: string;
  aiRequestId?: string;
  aiStatistics?: WritingStatistics;
  aiDetailedScores?: DetailedIeltsScores;
  submittedAt: string;
  createdAt: string;
  updatedAt?: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Component({
  selector: 'app-admin-self-check-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Quản lý Tự kiểm tra Writing (Admin)</h2>
        <p>Xem tất cả các bài tự kiểm tra của người dùng</p>
      </div>

      <div class="filters-section">
        <div class="filter-group">
          <label>Loại bài:</label>
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">Tất cả</option>
            <option value="TASK1">Task 1</option>
            <option value="TASK2">Task 2</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Sắp xếp:</label>
          <select [(ngModel)]="sortBy" (change)="onFilterChange()">
            <option value="date">Ngày làm bài</option>
            <option value="score">Điểm số</option>
            <option value="wordCount">Số từ</option>
          </select>
        </div>
      </div>

      <div class="history-list">
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Đang tải lịch sử...</p>
        </div>

        <div *ngIf="!loading() && paginatedHistory().length === 0" class="empty-state">
          <div class="empty-icon">≡</div>
          <h3>Chưa có bài tự kiểm tra nào</h3>
          <p>Chưa có người dùng nào thực hiện tự kiểm tra.</p>
        </div>

        <div *ngFor="let item of paginatedHistory()" class="history-item">
          <div class="history-card">
            <div class="history-card-header">
              <div class="title-block">
                <h3 class="task-title">{{ getTaskTitle(item) }}</h3>
                <div class="user-info">
                  <span class="user-label">Người làm bài:</span>
                  <span *ngIf="item.userName || item.userEmail" class="user-details">
                    <span *ngIf="item.userName" class="user-name">{{ item.userName }}</span>
                    <span *ngIf="item.userName && item.userEmail" class="user-separator"> · </span>
                    <span *ngIf="item.userEmail" class="user-email">{{ item.userEmail }}</span>
                  </span>
                  <span *ngIf="!item.userName && !item.userEmail" class="user-details">
                    <span class="user-id">ID: {{ item.userId }}</span>
                    <span class="anonymous-badge">(Anonymous)</span>
                  </span>
                </div>
              </div>
            </div>

            <div class="history-card-body">
              <div class="answer-preview">
                <h4>Đề bài</h4>
                <div class="answer-text" [innerHTML]="sanitizeHtml(getQuestionPreview(item.taskQuestion))"></div>
              </div>

              <div class="answer-preview">
                <h4>Bài viết</h4>
                <div class="answer-text" [innerHTML]="sanitizeHtml(getAnswerPreview(item.userAnswer))"></div>
              </div>

              <!-- All chips in one line -->
              <div class="all-chips">
                <span class="chip task-type-badge" [ngClass]="item.taskType.toLowerCase()">
                  {{ item.taskType === 'TASK1' ? 'Task 1' : 'Task 2' }}
                </span>
                <span class="chip meta-chip">
                  <span class="chip-icon">✎</span>{{ item.wordCount }} từ thực tế
                </span>
                <span class="chip user-chip">
                  <span class="chip-icon">·</span>
                  <span *ngIf="item.userName || item.userEmail">
                    <span *ngIf="item.userName">{{ item.userName }}</span>
                    <span *ngIf="item.userName && item.userEmail"> · </span>
                    <span *ngIf="item.userEmail">{{ item.userEmail }}</span>
                  </span>
                  <span *ngIf="!item.userName && !item.userEmail">ID: {{ item.userId }}</span>
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

      <div class="history-pagination" *ngIf="totalPages() > 1">
        <button
          class="btn btn-sm"
          [disabled]="currentPage() === 1"
          (click)="goToPage(currentPage() - 1)">
          ← Trước
        </button>

        <div class="page-numbers">
          <button
            *ngFor="let page of getPageNumbers()"
            class="btn btn-sm page-btn"
            [class.active]="page === currentPage()"
            (click)="goToPage(page)">
            {{ page }}
          </button>
        </div>

        <button
          class="btn btn-sm"
          [disabled]="currentPage() === totalPages()"
          (click)="goToPage(currentPage() + 1)">
          Sau →
        </button>
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

    .meta-chips,
    .result-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
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

    .meta-chip {
      background: #f8fafc;
      color: #334155;
    }

    .score-chip {
      background: #e0e7ff;
      color: #4338ca;
      font-weight: 600;
    }

    .submitted-meta {
      text-align: right;
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      align-items: flex-end;
    }

    .history-card-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .answer-preview h4 {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

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

    .result-chips .chip {
      font-weight: 600;
      color: #1e293b;
    }

    .result-chips .chip.meta-chip {
      background: #eef2ff;
      color: #1e293b;
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

      .history-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .submitted-meta {
        text-align: left;
      }

      .history-actions {
        flex-direction: column;
        align-items: stretch;
      }
    }
  `]
})
export class AdminSelfCheckListComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  selectedType = '';
  sortBy = 'date';
  currentPage = signal(1);
  itemsPerPage = 6;

  historyList = signal<WritingSelfCheckHistoryDto[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  filteredHistory = computed(() => {
    let filtered = this.historyList();

    if (this.selectedType) {
      filtered = filtered.filter(item => item.taskType === this.selectedType);
    }

    let sorted: WritingSelfCheckHistoryDto[];

    switch (this.sortBy) {
      case 'score':
        sorted = [...filtered].sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0));
        break;
      case 'wordCount':
        sorted = [...filtered].sort((a, b) => b.wordCount - a.wordCount);
        break;
      case 'date':
      default:
        sorted = [...filtered].sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        break;
    }

    return sorted;
  });

  totalPages = computed(() => {
    const totalItems = this.filteredHistory().length;
    if (totalItems === 0) {
      return 0;
    }
    return Math.ceil(totalItems / this.itemsPerPage);
  });

  paginatedHistory = computed(() => {
    const data = this.filteredHistory();
    if (data.length === 0) {
      return [];
    }

    const totalPages = Math.max(1, Math.ceil(data.length / this.itemsPerPage));
    const current = Math.min(Math.max(this.currentPage(), 1), totalPages);
    const start = (current - 1) * this.itemsPerPage;
    return data.slice(start, start + this.itemsPerPage);
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.error.set('Vui lòng đăng nhập để xem lịch sử tự kiểm tra.');
      return;
    }
    this.loadHistory();
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    // Load all pages and combine
    this.loadAllPages();
  }

  private loadAllPages(): void {
    const params = new HttpParams()
      .set('page', '0')
      .set('size', '1000'); // Load a large number to get all items

    this.http.get<Page<WritingSelfCheckHistoryDto>>(`${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/admin/writing-self-check/history`, { params }).subscribe({
      next: (page) => {
        this.historyList.set(page.content || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.error.set(err.error?.message || 'Không thể tải lịch sử. Vui lòng thử lại.');
        this.loading.set(false);
      }
    });
  }

  onFilterChange(): void {
    this.resetPagination();
  }

  viewFullAnswer(item: WritingSelfCheckHistoryDto): void {
    this.router.navigate(['/admin/writing-self-check/history', item.id]);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (total === 0) {
      this.currentPage.set(1);
      return;
    }
    const target = Math.min(Math.max(page, 1), total);
    this.currentPage.set(target);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    if (total <= 0) {
      return [];
    }
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  private resetPagination(): void {
    this.currentPage.set(1);
  }

  getTaskTitle(item: WritingSelfCheckHistoryDto): string {
    return `Tự kiểm tra - ${item.taskType === 'TASK1' ? 'Task 1' : 'Task 2'}`;
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

  getAnswerPreview(answer: string): string {
    if (!answer) return '';
    return answer.length > 200 ? answer.substring(0, 200) + '...' : answer;
  }

  getQuestionPreview(question: string): string {
    if (!question) return '';
    return question.length > 200 ? question.substring(0, 200) + '...' : question;
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
