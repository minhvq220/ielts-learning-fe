import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WritingHistoryService } from '../../services/writing-history.service';
import { WritingTaskService } from '../../services/writing-task.service';
import { WritingHistoryDto } from '../../services/writing-history-api.service';
import { WritingTask, WritingTask1, WritingTask2 } from '../../models/writing-task.model';

@Component({
  selector: 'app-writing-history-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="history-detail-container">
      <div class="detail-header">
        <button class="btn-back" (click)="goBack()">← Quay lại lịch sử</button>
        <div class="header-content">
          <h1>{{ getTaskTitle() }}</h1>
          <div class="header-badges">
            <span class="badge task-badge" [class.task1]="historyItem()?.taskType === 'TASK1'" [class.task2]="historyItem()?.taskType === 'TASK2'">
              {{ historyItem()?.taskType === 'TASK1' ? 'Task 1' : 'Task 2' }}
            </span>
            <span class="badge difficulty-badge" [class]="getTaskDifficulty()">
              {{ getDifficultyLabel(getTaskDifficulty()) }}
            </span>
            <span class="badge attempt-badge">Lần {{ getAttemptNumber() }}</span>
            <span class="badge date-badge">{{ formatDate(historyItem()?.submittedAt || '') }}</span>
          </div>
        </div>
      </div>

      <div class="loading-section" *ngIf="loading()">
        <div class="spinner"></div>
        <p>Đang tải chi tiết bài viết...</p>
      </div>

      <div class="error-section" *ngIf="error()">
        <div class="error-icon">❌</div>
        <h3>Không thể tải bài viết</h3>
        <p>{{ error() }}</p>
        <button class="btn btn-primary" (click)="goBack()">Quay lại lịch sử</button>
      </div>

      <ng-container *ngIf="!loading() && !error() && historyItem()">
        <div class="writing-main">
          <div class="left-column">
            <div class="info-tabs">
              <button
                class="tab-btn"
                [class.active]="activeInfoTab() === 'question'"
                (click)="setActiveInfoTab('question')">
                📋 Câu hỏi
              </button>
              <button
                class="tab-btn"
                *ngIf="getWritingGuide()"
                [class.active]="activeInfoTab() === 'guide'"
                (click)="setActiveInfoTab('guide')">
                📝 Hướng dẫn
              </button>
            </div>

            <div class="info-panel" *ngIf="activeInfoTab() === 'question'">
              <div class="task-instruction-panel-compact">
                <div class="task-title-compact">{{ getTaskTitle() }}</div>
                <div class="instruction-content-compact" [innerHTML]="getTaskInstruction()"></div>

                <div class="task1-content-compact" *ngIf="historyItem()?.taskType === 'TASK1'">
                  <div class="task1-image-compact" *ngIf="getTask1ImageUrl()">
                    <img [src]="getTask1ImageUrl()" alt="Task 1" class="task-image" />
                  </div>
                  <div class="task-section" *ngIf="getTask1Description()">
                    <div class="section-label">Mô tả:</div>
                    <div class="section-content">{{ getTask1Description() }}</div>
                  </div>
                </div>

                <div class="task2-content-compact" *ngIf="historyItem()?.taskType === 'TASK2'">
                  <div class="task-section" *ngIf="getTask2Question()">
                    <div class="section-label">Câu hỏi chính:</div>
                    <div class="section-content">{{ getTask2Question() }}</div>
                  </div>
                  <div class="task-section" *ngIf="getTask2AdditionalQuestions()?.length">
                    <div class="section-label">Câu hỏi bổ sung:</div>
                    <ul class="compact-list">
                      <li *ngFor="let question of getTask2AdditionalQuestions()">{{ question }}</li>
                    </ul>
                  </div>
                </div>

                <div class="task-requirements-compact">
                  <div class="requirement-item-compact">
                    <span class="label-compact">⏱️</span>
                    <span class="value-compact">{{ getTaskTimeLimit() }} phút</span>
                  </div>
                  <div class="requirement-item-compact">
                    <span class="label-compact">📝</span>
                    <span class="value-compact">{{ getTaskWordCount() }} từ</span>
                  </div>
                </div>

                <div class="tips-section-compact" *ngIf="getTaskTips().length">
                  <div class="section-label">💡 Mẹo:</div>
                  <ul class="compact-list">
                    <li *ngFor="let tip of getTaskTips()">{{ tip }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <div class="info-panel" *ngIf="activeInfoTab() === 'guide' && getWritingGuide()">
              <div class="writing-guide-panel-expanded">
                <div class="writing-guide-content" [innerHTML]="getWritingGuide()"></div>
              </div>
            </div>
          </div>

          <div class="writing-area">
            <div class="writing-textarea-container">
              <textarea class="writing-textarea" [value]="historyItem()!.answer" readonly></textarea>
            </div>

            <div class="writing-tools">
              <div class="tools-left">
                <div class="word-counter">
                  <span class="current-words">{{ historyItem()!.wordCount }}</span>
                  <span class="word-target">/ {{ getTaskWordCount() }} từ</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getWordProgress()"></div>
                  </div>
                </div>
              </div>
              <div class="tools-right">
                <div class="timer-section-compact">
                  <div class="timer-compact">⏱️ {{ formatDuration(historyItem()!.timeSpent) }}</div>
                </div>
                <div class="writing-actions">
                  <button class="btn btn-secondary" (click)="goBack()">Quay lại</button>
                  <button class="btn btn-primary" (click)="retakeTask()">Làm lại bài</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="evaluation-panel" *ngIf="historyItem()!.aiScore">
          <div class="evaluation-header">
            <h3>Kết quả AI Chấm bài</h3>
            <div class="overall-score">
              <span class="score-value">{{ historyItem()!.aiScore!.toFixed(1) }}/9</span>
              <span class="score-label">Điểm tổng</span>
            </div>
          </div>

          <div class="criteria-scores">
            <div class="criteria-item" *ngIf="historyItem()!.taskAchievement">
              <span class="criteria-name">Task Achievement</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.taskAchievement! / 9) * 100"></div>
                <span class="score-text">{{ historyItem()!.taskAchievement!.toFixed(1) }}/9</span>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.coherenceCohesion">
              <span class="criteria-name">Coherence & Cohesion</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.coherenceCohesion! / 9) * 100"></div>
                <span class="score-text">{{ historyItem()!.coherenceCohesion!.toFixed(1) }}/9</span>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.lexicalResource">
              <span class="criteria-name">Lexical Resource</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.lexicalResource! / 9) * 100"></div>
                <span class="score-text">{{ historyItem()!.lexicalResource!.toFixed(1) }}/9</span>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.grammaticalRange">
              <span class="criteria-name">Grammatical Range</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.grammaticalRange! / 9) * 100"></div>
                <span class="score-text">{{ historyItem()!.grammaticalRange!.toFixed(1) }}/9</span>
              </div>
            </div>
          </div>

          <div class="feedback-section" *ngIf="historyItem()!.aiFeedback">
            <h4>Nhận xét chi tiết:</h4>
            <p class="feedback-text">{{ historyItem()!.aiFeedback }}</p>
          </div>

          <div class="suggestions-section" *ngIf="historyItem()!.aiSuggestions?.length">
            <h4>Gợi ý cải thiện:</h4>
            <ul class="suggestions-list">
              <li *ngFor="let suggestion of historyItem()!.aiSuggestions">{{ suggestion }}</li>
            </ul>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .history-detail-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }

    .detail-header {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .btn-back {
      background: #1f2937;
      color: white;
      border: none;
      padding: 0.65rem 1.4rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .btn-back:hover {
      background: #111827;
    }

    .header-content {
      flex: 1;
    }

    .header-content h1 {
      margin: 0 0 1rem 0;
      color: #0f172a;
      font-size: 1.85rem;
      font-weight: 700;
    }

    .header-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      align-items: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #f1f5f9;
      color: #1f2937;
    }

    .badge.task-badge.task1 {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .badge.task-badge.task2 {
      background: #fee2e2;
      color: #b91c1c;
    }

    .badge.difficulty-badge.easy {
      background: #dcfce7;
      color: #166534;
    }

    .badge.difficulty-badge.medium {
      background: #fef3c7;
      color: #b45309;
    }

    .badge.difficulty-badge.hard {
      background: #fee2e2;
      color: #b91c1c;
    }

    .badge.attempt-badge {
      background: #ede9fe;
      color: #5b21b6;
    }

    .badge.date-badge {
      background: #cffafe;
      color: #0f766e;
    }

    .writing-main {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 1.5rem;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .info-tabs {
      display: flex;
      gap: 0.5rem;
      background: #ffffff;
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(15, 23, 42, 0.12);
    }

    .tab-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: #64748b;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f1f5f9;
      color: #1f2937;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: #ffffff;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.35);
    }

    .info-panel {
      flex: 1;
    }

    .task-instruction-panel-compact {
      background: #ffffff;
      padding: 1.25rem;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .task-title-compact {
      font-size: 1.05rem;
      font-weight: 600;
      color: #0f172a;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .instruction-content-compact {
      color: #1f2937;
      font-size: 0.9rem;
      line-height: 1.6;
    }

    .task1-image-compact {
      background: #f8fafc;
      padding: 0.75rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
    }

    .task-image {
      width: 100%;
      border-radius: 8px;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.15);
    }

    .task1-content-compact,
    .task2-content-compact {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 0.75rem;
    }

    .task-description-compact,
    .main-question-compact,
    .additional-questions-compact {
      margin-top: 0.5rem;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.4rem;
      display: block;
    }

    .section-content {
      font-size: 0.9rem;
      color: #1f2937;
      line-height: 1.6;
    }

    .task-requirements-compact {
      display: flex;
      gap: 1rem;
      background: #f1f5f9;
      padding: 0.75rem;
      border-radius: 10px;
    }

    .requirement-item-compact {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
      color: #1d4ed8;
    }

    .value-compact {
      font-weight: 600;
      color: #0f172a;
    }

    .tips-section-compact {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 0.75rem 1rem;
      border-radius: 10px;
    }

    .compact-list {
      margin: 0;
      padding-left: 1.2rem;
      font-size: 0.85rem;
      color: #334155;
    }

    .writing-guide-panel-expanded {
      background: #fff7ed;
      border-left: 4px solid #f97316;
      padding: 1.25rem;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(249, 115, 22, 0.18);
      max-height: 420px;
      overflow-y: auto;
    }

    .writing-guide-content {
      color: #1f2937;
      font-size: 0.9rem;
      line-height: 1.7;
    }

    .writing-area {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .writing-textarea-container {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      overflow: hidden;
    }

    .writing-textarea {
      width: 100%;
      min-height: 460px;
      padding: 1.5rem;
      border: none;
      resize: none;
      font-size: 1rem;
      line-height: 1.65;
      font-family: 'Times New Roman', serif;
      color: #0f172a;
      background: #ffffff;
    }

    .writing-textarea:focus {
      outline: none;
    }

    .writing-tools {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      background: #ffffff;
      padding: 1rem 1.5rem;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
    }

    .tools-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .word-counter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      font-size: 0.9rem;
    }

    .current-words {
      font-weight: 700;
      color: #3b82f6;
      font-size: 1rem;
    }

    .word-target {
      color: #64748b;
      font-size: 0.85rem;
    }

    .progress-bar {
      width: 140px;
      height: 6px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #14b8a6);
      transition: width 0.3s ease;
    }

    .tools-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .timer-section-compact {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      background: #f8fafc;
      padding: 0.5rem 1rem;
      border-radius: 10px;
      border: 1px solid #e2e8f0;
      font-weight: 600;
      color: #334155;
    }

    .writing-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn {
      padding: 0.6rem 1.45rem;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #3b82f6;
      color: #ffffff;
    }

    .btn-primary:hover {
      background: #2563eb;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #1f2937;
    }

    .btn-secondary:hover {
      background: #cbd5f5;
      color: #0f172a;
    }

    .evaluation-panel {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      margin-top: 2rem;
      padding: 1.75rem;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
      margin-bottom: 1.5rem;
    }

    .evaluation-header h3 {
      margin: 0;
      color: #0f172a;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .overall-score {
      text-align: center;
    }

    .score-value {
      font-size: 2rem;
      font-weight: 700;
      color: #22c55e;
      display: block;
    }

    .score-label {
      font-size: 0.85rem;
      color: #6b7280;
    }

    .criteria-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .criteria-item {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 10px;
    }

    .criteria-name {
      font-weight: 600;
      color: #1f2937;
      display: block;
      margin-bottom: 0.5rem;
    }

    .score-bar {
      position: relative;
      height: 10px;
      background: #e2e8f0;
      border-radius: 999px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #22c55e, #3b82f6);
      transition: width 0.3s ease;
    }

    .score-text {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.75rem;
      font-weight: 600;
      color: #ffffff;
    }

    .feedback-section,
    .suggestions-section {
      margin-top: 1.5rem;
    }

    .feedback-section h4,
    .suggestions-section h4 {
      margin: 0 0 0.75rem 0;
      color: #0f172a;
      font-size: 1rem;
      font-weight: 600;
    }

    .feedback-text {
      background: #f0fdf4;
      border-left: 4px solid #22c55e;
      padding: 1rem;
      border-radius: 10px;
      margin: 0;
      line-height: 1.6;
      color: #14532d;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 1.5rem;
      color: #1f2937;
      line-height: 1.6;
    }

    .loading-section,
    .error-section {
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #e5e7eb;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .error-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
    }

    .error-section h3 {
      margin: 0 0 0.5rem 0;
      color: #dc2626;
    }

    .error-section p {
      margin: 0 0 1.5rem 0;
      color: #6b7280;
    }

    @media (max-width: 1024px) {
      .writing-main {
        grid-template-columns: 1fr;
      }

      .writing-tools {
        flex-direction: column;
        align-items: stretch;
      }

      .tools-right {
        justify-content: space-between;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .history-detail-container {
        padding: 1rem;
      }

      .detail-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }

      .header-content h1 {
        font-size: 1.5rem;
      }

      .writing-main {
        gap: 1rem;
      }

      .writing-textarea {
        min-height: 320px;
      }

      .writing-tools {
        gap: 1rem;
      }

      .tools-right {
        flex-direction: column;
        align-items: stretch;
        gap: 0.75rem;
      }

      .criteria-scores {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class WritingHistoryDetailComponent implements OnInit {
  private historyService = inject(WritingHistoryService);
  private writingService = inject(WritingTaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  historyItem = signal<WritingHistoryDto | null>(null);
  originalTask = signal<WritingTask | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeInfoTab = signal<'question' | 'guide'>('question');

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const historyId = Number(params['id']);
      if (historyId) {
        this.loadHistoryItem(historyId);
      }
    });
  }

  private loadHistoryItem(historyId: number): void {
    this.loading.set(true);
    this.error.set(null);

    const history = this.historyService.history();
    const item = history.find(h => h.id === historyId);

    if (item) {
      this.historyItem.set(item);
      const tasks = this.writingService.sortedTasks();
      const originalTask = tasks.find(t => t.id === item.taskId.toString());
      if (originalTask) {
        this.originalTask.set(originalTask);
      }
      this.loading.set(false);
    } else {
      this.error.set('Không tìm thấy bài viết này');
      this.loading.set(false);
    }
  }

  setActiveInfoTab(tab: 'question' | 'guide'): void {
    this.activeInfoTab.set(tab);
  }

  getAttemptNumber(): number {
    const item = this.historyItem();
    if (!item) return 0;

    const taskHistory = this.historyService.history().filter(h => h.taskId === item.taskId);
    const sortedHistory = [...taskHistory].sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
    return sortedHistory.findIndex(h => h.id === item.id) + 1;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDuration(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} phút ${remainingSeconds.toString().padStart(2, '0')} giây`;
  }

  getWordProgress(): number {
    const target = this.getTaskWordCount() || 1;
    const current = this.historyItem()?.wordCount || 0;
    return Math.min((current / target) * 100, 100);
  }

  getTaskTitle(): string {
    const task = this.originalTask();
    return task?.title || this.historyItem()?.taskTitle || 'Bài viết';
  }

  getTaskInstruction(): string {
    const task = this.originalTask();
    return task?.instruction || '';
  }

  getTask1Description(): string {
    const task = this.originalTask();
    if (task?.type === 'task1') {
      return (task as WritingTask1).description || '';
    }
    return '';
  }

  getTask1ImageUrl(): string {
    const task = this.originalTask();
    if (task?.type === 'task1') {
      return (task as WritingTask1).imageUrl || '';
    }
    return '';
  }

  getTask2Question(): string {
    const task = this.originalTask();
    if (task?.type === 'task2') {
      return (task as WritingTask2).question || '';
    }
    return '';
  }

  getTask2AdditionalQuestions(): string[] {
    const task = this.originalTask();
    if (task?.type === 'task2') {
      return (task as WritingTask2).additionalQuestions || [];
    }
    return [];
  }

  getTaskTips(): string[] {
    return this.originalTask()?.tips || [];
  }

  getWritingGuide(): string {
    return this.originalTask()?.writingGuide || '';
  }

  getTaskTimeLimit(): number {
    return this.originalTask()?.timeLimit || 0;
  }

  getTaskWordCount(): number {
    return this.originalTask()?.wordCount || 0;
  }

  getTaskDifficulty(): string {
    return this.originalTask()?.difficulty || '';
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      easy: 'Dễ',
      medium: 'Trung bình',
      hard: 'Khó'
    };
    return labels[difficulty] || difficulty;
  }

  retakeTask(): void {
    const item = this.historyItem();
    if (item) {
      this.router.navigate(['/writing'], { queryParams: { taskId: item.taskId } });
    }
  }

  goBack(): void {
    this.router.navigate(['/writing/history']);
  }
}
