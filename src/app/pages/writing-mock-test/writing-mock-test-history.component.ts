import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WritingHistoryApiService, WritingHistoryDto, Page } from '../../services/writing-history-api.service';
import { AuthService } from '../../services/auth.service';
import { Subject, takeUntil } from 'rxjs';

interface MockTestSession {
  id: string; // Unique identifier for this mock test session
  task1: WritingHistoryDto | null;
  task2: WritingHistoryDto | null;
  submittedAt: Date;
  averageScore?: number;
}

@Component({
  selector: 'app-writing-mock-test-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mock-test-history-container">
      <div class="history-header">
        <h2>Lịch sử Mock Test</h2>
        <p>Xem lại các bài Mock Test đã hoàn thành</p>
      </div>

      <div class="history-list">
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Đang tải lịch sử...</p>
        </div>

        <div *ngIf="!loading() && mockTestSessions().length === 0" class="empty-state">
          <div class="empty-icon">≡</div>
          <h3>Chưa có Mock Test nào</h3>
          <p>Hãy làm Mock Test để xem lịch sử ở đây!</p>
          <button class="btn btn-primary" (click)="goToStartMockTest()">Làm Mock Test ngay</button>
        </div>

        <div *ngFor="let session of mockTestSessions()" class="mock-test-session">
          <div class="session-card">
            <div class="session-header">
              <div class="session-info">
                <h3>Mock Test #{{ getSessionNumber(session) }}</h3>
                <span class="session-date">{{ formatDate(session.submittedAt) }} {{ formatTime(session.submittedAt) }}</span>
              </div>
              <div class="session-score" *ngIf="session.averageScore">
                <div class="score-label">Tổng điểm</div>
                <div class="score-value">{{ session.averageScore.toFixed(1) }} / 9.0</div>
              </div>
            </div>

            <div class="session-tasks">
              <!-- Task 1 -->
              <div class="task-card" *ngIf="session.task1">
                <div class="task-header">
                  <h4>Task 1</h4>
                  <div class="task-score" *ngIf="session.task1.aiScore">
                    {{ session.task1.aiScore.toFixed(1) }} / 9.0
                  </div>
                </div>
                <div class="task-details">
                  <div class="detail-item">
                    <span class="detail-label">Task Achievement:</span>
                    <span class="detail-value">{{ session.task1.taskAchievement?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Coherence & Cohesion:</span>
                    <span class="detail-value">{{ session.task1.coherenceCohesion?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Lexical Resource:</span>
                    <span class="detail-value">{{ session.task1.lexicalResource?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Grammatical Range:</span>
                    <span class="detail-value">{{ session.task1.grammaticalRange?.toFixed(1) || 'N/A' }}</span>
                  </div>
                </div>
                <button class="btn btn-detail" (click)="viewTaskDetail(session.task1!.id)">
                  Xem chi tiết →
                </button>
              </div>

              <!-- Task 2 -->
              <div class="task-card" *ngIf="session.task2">
                <div class="task-header">
                  <h4>Task 2</h4>
                  <div class="task-score" *ngIf="session.task2.aiScore">
                    {{ session.task2.aiScore.toFixed(1) }} / 9.0
                  </div>
                </div>
                <div class="task-details">
                  <div class="detail-item">
                    <span class="detail-label">Task Achievement:</span>
                    <span class="detail-value">{{ session.task2.taskAchievement?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Coherence & Cohesion:</span>
                    <span class="detail-value">{{ session.task2.coherenceCohesion?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Lexical Resource:</span>
                    <span class="detail-value">{{ session.task2.lexicalResource?.toFixed(1) || 'N/A' }}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Grammatical Range:</span>
                    <span class="detail-value">{{ session.task2.grammaticalRange?.toFixed(1) || 'N/A' }}</span>
                  </div>
                </div>
                <button class="btn btn-detail" (click)="viewTaskDetail(session.task2!.id)">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div class="pagination" *ngIf="historyPage() && historyPage()!.totalPages > 1">
        <button 
          class="btn btn-secondary" 
          [disabled]="currentPage() === 0"
          (click)="goToPage(currentPage() - 1)">
          ← Trước
        </button>
        <span class="page-info">
          Trang {{ currentPage() + 1 }} / {{ historyPage()!.totalPages }}
        </span>
        <button 
          class="btn btn-secondary" 
          [disabled]="currentPage() >= historyPage()!.totalPages - 1"
          (click)="goToPage(currentPage() + 1)">
          Sau →
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mock-test-history-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 70px);
    }

    .history-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e9ecef;
    }

    .history-header h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .history-header p {
      color: #6c757d;
      margin: 0;
    }

    .loading {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0d9488;
      border-radius: 0;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      background: white;
      border-radius: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-state h3 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .empty-state p {
      color: #6c757d;
      margin-bottom: 1.5rem;
    }

    .mock-test-session {
      margin-bottom: 2rem;
    }

    .session-card {
      background: white;
      border-radius: 0;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 1.5rem;
      border-left: 4px solid #0d9488;
    }

    .session-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .session-info h3 {
      margin: 0 0 0.25rem 0;
      color: #2c3e50;
    }

    .session-date {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .session-score {
      text-align: right;
    }

    .score-label {
      font-size: 0.85rem;
      color: #6c757d;
      margin-bottom: 0.25rem;
    }

    .score-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0d9488;
    }

    .session-tasks {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .task-card {
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 0;
      border-left: 3px solid #0d9488;
    }

    .task-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .task-header h4 {
      margin: 0;
      color: #2c3e50;
    }

    .task-score {
      font-size: 1.1rem;
      font-weight: 600;
      color: #0d9488;
    }

    .task-details {
      margin-bottom: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e9ecef;
    }

    .detail-item:last-child {
      border-bottom: none;
    }

    .detail-label {
      color: #6c757d;
      font-size: 0.9rem;
    }

    .detail-value {
      color: #2c3e50;
      font-weight: 600;
    }

    .btn {
      padding: 0.5rem 1.25rem;
      border: none;
      border-radius: 0;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #0d9488;
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
    }

    .btn-detail {
      width: 100%;
      background: #0d9488;
      color: white;
      margin-top: 0.5rem;
    }

    .btn-detail:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.25);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-secondary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #e9ecef;
    }

    .page-info {
      color: #6c757d;
      font-weight: 600;
    }

    @media (max-width: 768px) {
      .mock-test-history-container {
        padding: 1rem;
      }

      .session-tasks {
        grid-template-columns: 1fr;
      }

      .session-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .session-score {
        text-align: left;
      }
    }
  `]
})
export class WritingMockTestHistoryComponent implements OnInit, OnDestroy {
  private apiService = inject(WritingHistoryApiService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private destroy$ = new Subject<void>();

  loading = signal(false);
  historyPage = signal<Page<WritingHistoryDto> | null>(null);
  currentPage = signal(0);
  mockTestSessions = signal<MockTestSession[]>([]);

  ngOnInit() {
    this.loadHistory();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHistory() {
    const userId = this.getUserId();
    if (!userId) {
      console.error('User ID not found');
      return;
    }

    this.loading.set(true);
    
    this.apiService.getUserHistoryPage(userId, this.currentPage(), 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (page) => {
          this.historyPage.set(page);
          this.groupIntoMockTestSessions(page.content);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading history:', error);
          this.loading.set(false);
        }
      });
  }

  private groupIntoMockTestSessions(histories: WritingHistoryDto[]) {
    // Group histories by submission time (within 5 minutes) and ensure we have both Task 1 and Task 2
    const sessions: Map<string, MockTestSession> = new Map();
    
    // Sort by submittedAt descending
    const sorted = [...histories].sort((a, b) => 
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    for (const history of sorted) {
      const submittedAt = new Date(history.submittedAt);
      
      // Find existing session within 5 minutes
      let foundSession: MockTestSession | null = null;
      for (const [sessionId, session] of sessions.entries()) {
        const timeDiff = Math.abs(submittedAt.getTime() - session.submittedAt.getTime());
        if (timeDiff <= 5 * 60 * 1000) { // 5 minutes
          foundSession = session;
          break;
        }
      }

      if (foundSession) {
        // Add to existing session
        if (history.taskType === 'TASK1' && !foundSession.task1) {
          foundSession.task1 = history;
        } else if (history.taskType === 'TASK2' && !foundSession.task2) {
          foundSession.task2 = history;
        }
        
        // Update average score if both tasks are present
        if (foundSession.task1?.aiScore && foundSession.task2?.aiScore) {
          foundSession.averageScore = (foundSession.task1.aiScore + foundSession.task2.aiScore) / 2;
        }
      } else {
        // Create new session
        const sessionId = `mock-test-${submittedAt.getTime()}`;
        const newSession: MockTestSession = {
          id: sessionId,
          task1: history.taskType === 'TASK1' ? history : null,
          task2: history.taskType === 'TASK2' ? history : null,
          submittedAt: submittedAt,
          averageScore: undefined
        };
        sessions.set(sessionId, newSession);
      }
    }

    // Filter to only include sessions with both Task 1 and Task 2
    const validSessions = Array.from(sessions.values())
      .filter(session => session.task1 && session.task2)
      .sort((a, b) => b.submittedAt.getTime() - a.submittedAt.getTime());

    this.mockTestSessions.set(validSessions);
  }

  getSessionNumber(session: MockTestSession): number {
    const sessions = this.mockTestSessions();
    return sessions.length - sessions.indexOf(session);
  }

  viewTaskDetail(historyId: number) {
    sessionStorage.setItem('writing_history_previous_url', '/writing/mock-test/history');
    this.router.navigate(['/writing/history', historyId]);
  }

  goToMockTest() {
    this.router.navigate(['/writing/mock-test']);
  }
  
  goToStartMockTest() {
    // Clear any old state and start fresh
    sessionStorage.removeItem('mock_test_result_state');
    sessionStorage.removeItem('coming_back_from_mock_test_detail');
    this.router.navigate(['/writing/mock-test/start']);
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadHistory();
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  }

  formatTime(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  sanitizeHtml(html: string | null | undefined): SafeHtml {
    if (!html) {
      return this.sanitizer.sanitize(1, '') as SafeHtml;
    }
    return this.sanitizer.sanitize(1, html) as SafeHtml;
  }

  private getUserId(): string | null {
    const authState = this.authService.getAuthState();
    if (authState.isAuthenticated && authState.user?.id) {
      return authState.user.id;
    }
    
    // Try to get anonymous user ID
    const anonymousUserId = localStorage.getItem('anonymous_user_id');
    return anonymousUserId;
  }
}


