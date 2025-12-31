import { Component, signal, computed, inject, OnInit, AfterViewInit, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import flatpickr from 'flatpickr';
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
  taskType: string;
  taskQuestion: string;
  userAnswer: string;
  wordCount: number;
  imageData?: string;
  imageMimeType?: string;
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
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
      empty: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  numberOfElements: number;
  size: number;
  number: number;
  sort: {
    sorted: boolean;
    unsorted: boolean;
    empty: boolean;
  };
  empty: boolean;
}

@Component({
  selector: 'app-writing-self-check-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="history-container">
      <div class="history-header">
        <h2>Lịch sử Tự kiểm tra Writing</h2>
        <p>Xem lại các bài tự kiểm tra đã làm và điểm số</p>
      </div>

      <div class="stats-section" *ngIf="userStats()">
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📝</div>
            <div class="stat-content">
              <div class="stat-number">{{ userStats()!.totalCompleted }}</div>
              <div class="stat-label">Tổng bài đã làm</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ userStats()!.averageScore?.toFixed(1) || 'N/A' }}</div>
              <div class="stat-label">Điểm trung bình</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ userStats()!.task1Completed }}</div>
              <div class="stat-label">Task 1</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📋</div>
            <div class="stat-content">
              <div class="stat-number">{{ userStats()!.task2Completed }}</div>
              <div class="stat-label">Task 2</div>
            </div>
          </div>
        </div>
      </div>

      <div class="filters-section">
        <!-- Advanced Filters -->
        <div class="advanced-filters" *ngIf="showAdvancedFilters()">
          <div class="filter-group">
            <label>Loại bài:</label>
            <select [(ngModel)]="selectedType">
              <option value="">Tất cả</option>
              <option value="TASK1">Task 1</option>
              <option value="TASK2">Task 2</option>
            </select>
          </div>
          
          <!-- Date Filters -->
          <div class="filter-group date-filter-group">
            <label>📅 Ngày làm bài:</label>
            <div class="date-inputs-wrapper">
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
          </div>
          
          <div class="filter-group clear-filter-group">
            <button class="btn btn-secondary btn-clear" (click)="clearFilters()" *ngIf="hasActiveFilters()">Xóa bộ lọc</button>
          </div>
        </div>
        
        <!-- Search Box -->
        <div class="filter-group search-group">
          <div class="search-input-wrapper">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="triggerSearch()"
              (input)="onSearchChange()"
              placeholder="Tìm theo đề bài, nội dung bài viết..."
              class="search-input">
            <button class="btn btn-primary btn-search" (click)="triggerSearch()" type="button" title="Tìm kiếm">
              <span class="search-icon">🔍</span>
            </button>
            <button class="btn btn-secondary btn-advanced" (click)="toggleAdvancedFilters()" type="button" [class.active]="showAdvancedFilters()" title="Tìm kiếm nâng cao">
              <svg class="filter-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6H20M7 12H17M10 18H14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div class="history-list">
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Đang tải lịch sử...</p>
        </div>

        <div *ngIf="!loading() && historyPage() && historyPage()!.content.length === 0" class="empty-state">
          <div class="empty-icon">📚</div>
          <h3>Không tìm thấy bài tự kiểm tra nào</h3>
          <p *ngIf="hasActiveFilters()">Không có kết quả phù hợp với bộ lọc. Hãy thử điều chỉnh bộ lọc hoặc xóa bộ lọc để xem tất cả.</p>
          <p *ngIf="!hasActiveFilters()">Hãy bắt đầu tự kiểm tra để xem lịch sử ở đây!</p>
        </div>

        <div *ngFor="let item of historyPage()?.content || []" class="history-item">
          <div class="history-card">
            <div class="history-card-header">
              <div class="title-block">
                <h3 class="task-title">{{ getTaskTitle(item) }}</h3>
                <div class="meta-chips">
                  <span class="chip task-type-badge" [ngClass]="item.taskType.toLowerCase()">
                    {{ item.taskType === 'TASK1' ? 'Task 1' : 'Task 2' }}
                  </span>
                  <span class="chip meta-chip">
                    <span class="chip-icon">📝</span>{{ item.wordCount }} từ
                  </span>
                </div>
              </div>
              <div class="submitted-meta">
                <span class="submitted-date">{{ formatDate(item.submittedAt) }}</span>
                <span class="submitted-time">{{ formatTime(item.submittedAt) }}</span>
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

              <div class="result-chips">
                <span class="chip meta-chip">
                  <span class="chip-icon">📝</span>{{ item.wordCount }} từ thực tế
                </span>
                <span class="chip meta-chip score-chip" *ngIf="item.aiScore">
                  <span class="chip-icon">🎯</span>{{ item.aiScore.toFixed(1) }}/9
                </span>
                <span class="chip meta-chip">
                  <span class="chip-icon">📅</span>{{ formatDate(item.submittedAt) }} {{ formatTime(item.submittedAt) }}
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

    .stats-section {
      margin-bottom: 2rem;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-card {
      background: #ffffff;
      padding: 1rem 1.1rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 6px 16px rgba(15, 23, 42, 0.08);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .stat-icon {
      font-size: 2rem;
    }

    .stat-content {
      flex: 1;
    }

    .stat-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: #3b82f6;
    }

    .stat-label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .filters-section {
      background: #ffffff;
      padding: 1rem 1.25rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
      margin-bottom: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
    }

    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      background: white;
      font-size: 0.875rem;
      min-width: 150px;
    }

    .search-group {
      width: 100%;
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
      border-radius: 6px;
      font-size: 0.9rem;
    }

    .btn-search {
      padding: 0.5rem 0.75rem;
      min-width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-search:hover {
      background: linear-gradient(135deg, #1e40af, #1e3a8a);
    }

    .btn-advanced {
      padding: 0.5rem 0.75rem;
      min-width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 500;
    }

    .btn-advanced {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }
    
    .btn-advanced:hover {
      background: #e5e7eb;
    }
    
    .btn-advanced.active {
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: white;
      border-color: #2563eb;
    }

    .search-icon {
      display: inline-block;
      font-size: 1.1rem;
      line-height: 1;
    }

    .filter-icon {
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .advanced-filters {
      display: flex;
      flex-wrap: wrap;
      gap: 2.5rem;
      align-items: flex-end;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
      margin-bottom: 0;
    }

    .date-filter-group {
      flex: 0 0 auto;
    }

    .date-inputs-wrapper {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .date-input {
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.85rem;
      min-width: 120px;
    }

    .date-separator {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
      white-space: nowrap;
    }

    .clear-filter-group {
      flex: 0 0 auto;
    }

    .clear-filter-group .btn-clear {
      padding: 0.5rem 1rem;
      white-space: nowrap;
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
      border-radius: 12px;
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
      color: #0f172a;
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
      border-radius: 999px;
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
      border-radius: 8px;
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
      border-radius: 999px;
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
      border-radius: 10px;
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
      border-radius: 999px;
      overflow: hidden;
    }

    .criteria-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #2563eb);
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
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-sm {
      padding: 0.4rem 0.75rem;
      font-size: 0.825rem;
    }

    .btn-primary {
      background: #2563eb;
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
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
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
      background: #3b82f6;
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

      .filter-group:has(.btn-apply) {
        flex-direction: column;
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
export class WritingSelfCheckHistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  router = inject(Router);
  private sanitizer = inject(DomSanitizer);

  selectedType = '';
  searchQuery = '';
  fromDate = '';
  toDate = '';
  showAdvancedFilters = signal(false); // Track advanced filters visibility
  
  @ViewChild('fromDateInput') fromDateInput!: ElementRef<HTMLInputElement>;
  @ViewChild('toDateInput') toDateInput!: ElementRef<HTMLInputElement>;
  
  private fromDatePicker: flatpickr.Instance | null = null;
  private toDatePicker: flatpickr.Instance | null = null;
  
  currentPage = signal(0);
  itemsPerPage = 6;
  searchDebounceTimer: any = null;

  historyPage = signal<Page<WritingSelfCheckHistoryDto> | null>(null);
  allHistoryForStats = signal<WritingSelfCheckHistoryDto[]>([]);
  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  // Computed stats from all history
  userStats = computed(() => {
    const allHistory = this.allHistoryForStats();
    if (allHistory.length === 0) {
      // Fallback to page data if all history not loaded yet
      const page = this.historyPage();
      if (!page) return null;
      
      // Estimate based on current page
      const totalCompleted = page.totalElements;
      const task1Ratio = page.content.length > 0 
        ? page.content.filter(item => item.taskType === 'TASK1').length / page.content.length 
        : 0;
      const task2Ratio = page.content.length > 0 
        ? page.content.filter(item => item.taskType === 'TASK2').length / page.content.length 
        : 0;
      
      const itemsWithScores = page.content.filter(item => item.aiScore != null && item.aiScore > 0);
      const averageScore = itemsWithScores.length > 0
        ? itemsWithScores.reduce((sum, item) => sum + (item.aiScore || 0), 0) / itemsWithScores.length
        : undefined;

      return {
        totalCompleted,
        task1Completed: Math.round(totalCompleted * task1Ratio),
        task2Completed: Math.round(totalCompleted * task2Ratio),
        averageScore
      };
    }

    // Calculate from all history
    const totalCompleted = allHistory.length;
    const task1Completed = allHistory.filter(item => item.taskType === 'TASK1').length;
    const task2Completed = allHistory.filter(item => item.taskType === 'TASK2').length;
    
    const itemsWithScores = allHistory.filter(item => item.aiScore != null && item.aiScore > 0);
    const averageScore = itemsWithScores.length > 0
      ? itemsWithScores.reduce((sum, item) => sum + (item.aiScore || 0), 0) / itemsWithScores.length
      : undefined;

    return {
      totalCompleted,
      task1Completed,
      task2Completed,
      averageScore
    };
  });

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.error.set('Vui lòng đăng nhập để xem lịch sử tự kiểm tra.');
      return;
    }
    this.loadHistory();
    this.loadAllHistoryForStats();
  }

  ngAfterViewInit() {
    // Initialize flatpickr will be done when advanced filters are shown
    this.initializeDatePickers();
  }

  initializeDatePickers() {
    // Destroy existing pickers if they exist
    if (this.fromDatePicker) {
      this.fromDatePicker.destroy();
      this.fromDatePicker = null;
    }
    if (this.toDatePicker) {
      this.toDatePicker.destroy();
      this.toDatePicker = null;
    }

    // Initialize flatpickr for date inputs if they exist
    if (this.fromDateInput?.nativeElement) {
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

    if (this.toDateInput?.nativeElement) {
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

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters.set(!this.showAdvancedFilters());
    // Initialize date pickers after advanced filters are shown
    if (this.showAdvancedFilters()) {
      // Use setTimeout to wait for DOM to update
      setTimeout(() => {
        this.initializeDatePickers();
      }, 0);
    }
  }

  ngOnDestroy() {
    // Destroy flatpickr instances
    if (this.fromDatePicker) {
      this.fromDatePicker.destroy();
    }
    if (this.toDatePicker) {
      this.toDatePicker.destroy();
    }
  }

  loadHistory(): void {
    this.loading.set(true);
    this.error.set(null);

    // Convert dd/mm/yyyy to yyyy-mm-dd for API
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

    this.http.get<Page<WritingSelfCheckHistoryDto>>(`${AppConfig.api.baseUrl}/api/writing-self-check/history`, { params }).subscribe({
      next: (page) => {
        this.historyPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading history:', err);
        this.error.set(err.error?.message || 'Không thể tải lịch sử. Vui lòng thử lại.');
        this.loading.set(false);
      }
    });
  }

  loadAllHistoryForStats(): void {
    // Load all history without filters for accurate stats calculation
    let params = new HttpParams()
      .set('page', '0')
      .set('size', '1000'); // Large size to get all history

    this.http.get<Page<WritingSelfCheckHistoryDto>>(`${AppConfig.api.baseUrl}/api/writing-self-check/history`, { params }).subscribe({
      next: (page) => {
        this.allHistoryForStats.set(page.content);
      },
      error: (err) => {
        console.error('Error loading all history for stats:', err);
        // Silently fail, stats will use fallback from current page
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

  onSearchChange() {
    // Debounce search when typing (optional - user can also press Enter or button)
    // For now, we'll keep it disabled and require explicit button click
    // Uncomment below if you want auto-search while typing
    /*
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage.set(0);
      this.loadHistory();
    }, 500);
    */
  }

  triggerSearch() {
    // Apply all filters (search, task type, date range) when button is clicked or Enter is pressed
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.currentPage.set(0);
    this.loadHistory();
  }

  viewFullAnswer(item: WritingSelfCheckHistoryDto): void {
    this.router.navigate(['/writing-self-check/history', item.id]);
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
    
    // Show max 7 pages
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

  // Convert d/m/Y or dd/mm/yyyy to ISO string for API (isStart = true for fromDate, false for toDate)
  convertDateFormat(dateStr: string, isStart: boolean): string {
    // Support both d/m/Y and dd/mm/yyyy formats from flatpickr
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
