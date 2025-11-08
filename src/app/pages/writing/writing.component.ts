import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { WritingTaskService } from '../../services/writing-task.service';
import { WritingHistoryService } from '../../services/writing-history.service';
import { WritingTask, WritingTask1, WritingTask2 } from '../../models/writing-task.model';
import { Subject, takeUntil } from 'rxjs';

interface AIEvaluation {
  overallScore: number;
  taskAchievement: number;
  coherenceCohesion: number;
  lexicalResource: number;
  grammaticalRange: number;
  feedback: string;
  suggestions: string[];
  sampleAnswer: string;
}

@Component({
  selector: 'app-writing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="writing-container">
      <!-- Task Selection Panel -->
      <div class="task-selection-panel" *ngIf="!selectedTask()">
        <div class="panel-header">
          <div class="header-top">
            <div>
              <h2>Chọn bài tập Writing</h2>
              <p>Chọn một bài tập để bắt đầu luyện tập</p>
        </div>
            <a routerLink="/writing/history" class="history-btn">
              <span class="history-icon">📚</span>
              <span>Lịch sử làm bài</span>
            </a>
          </div>
          
          <!-- Introduction -->
          <div class="writing-intro">
            <h3 class="intro-title">Luyện IELTS Writing với AI</h3>
            <p class="intro-line">
              <strong>1.</strong> Luyện IELTS Writing với AI theo phương pháp <strong>Logical Framework</strong> của YouPass.
            </p>
            <p class="intro-line">
              <strong>2.</strong> Phù hợp nhất với trình độ đầu vào Writing <strong>5.5 ~ 6.5</strong>, nếu bạn thấp hoặc cao hơn thì sẽ không hiệu quả tối đa.
            </p>
            <p class="intro-callout">Bạn hãy chọn bài mình thích và viết ngay nha!</p>
          </div>

          <!-- Stats Overview -->
          <div class="stats-overview" *ngIf="userStats()">
            <div class="stat-summary">
              <div class="summary-title">Tổng quan luyện tập</div>
              <div class="summary-value">{{ userStats()!.totalCompleted }} bài</div>
              <div class="summary-sub">
                Điểm TB: <strong>{{ userStats()!.averageScore?.toFixed(1) || 'N/A' }}</strong> / 9
              </div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-groups">
              <div class="stat-mini">
                <span class="mini-label">Task 1</span>
                <span class="mini-value">{{ userStats()!.task1Completed }}</span>
              </div>
              <div class="stat-mini">
                <span class="mini-label">Task 2</span>
                <span class="mini-value">{{ userStats()!.task2Completed }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Tabs -->
        <div class="task-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'uncompleted'"
            (click)="setActiveTab('uncompleted')">
            Bài chưa làm ({{ uncompletedCount() }})
            </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'completed'"
            (click)="setActiveTab('completed')">
            Bài đã làm ({{ completedCount() }})
            </button>
          </div>
        
        <div class="task-filters">
          <div class="filter-group">
            <label>Loại bài:</label>
            <select [(ngModel)]="selectedType" (change)="onFilterChange()">
              <option value="">Tất cả</option>
              <option value="task1">Task 1</option>
              <option value="task2">Task 2</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Độ khó:</label>
            <select [(ngModel)]="selectedDifficulty" (change)="onFilterChange()">
              <option value="">Tất cả</option>
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
        </div>
      </div>

        <div class="task-grid">
          <div 
            *ngFor="let task of paginatedTasks()" 
            class="task-card"
            [class.completed]="isTaskCompleted(task)"
            (click)="selectTask(task)">
            <div class="task-card-header">
              <h3 class="task-title">{{ task.title }}</h3>
              <span *ngIf="isTaskCompleted(task)" class="completed-badge">
                ✓ Đã làm
              </span>
            </div>

            <div class="task-card-meta">
              <span class="chip task-type-badge" [class.task1]="task.type === 'task1'" [class.task2]="task.type === 'task2'">
                {{ task.type === 'task1' ? 'Task 1' : 'Task 2' }}
              </span>
              <span class="chip difficulty-badge" [class]="task.difficulty">
                {{ getDifficultyLabel(task.difficulty) }}
              </span>
              <span class="chip meta-chip">
                <span class="chip-icon">⏱️</span>{{ task.timeLimit }} phút
              </span>
              <span class="chip meta-chip">
                <span class="chip-icon">📝</span>{{ task.wordCount }} từ
              </span>
            </div>

            <p class="task-preview">{{ getTaskPreview(task) }}</p>
            
            <div *ngIf="isTaskCompleted(task) && getLatestAttempt(task)" class="latest-attempt">
              <div class="attempt-info">
                <span class="attempt-score">{{ getLatestAttempt(task)!.aiScore?.toFixed(1) || 'N/A' }}/9</span>
                <span class="attempt-date">{{ formatDate(getLatestAttempt(task)!.submittedAt) }}</span>
              </div>
            </div>

            <div class="task-tags" *ngIf="task.tags?.length">
              <span *ngFor="let tag of task.tags" class="tag">{{ tag }}</span>
            </div>
          </div>
        </div>

        <div class="task-pagination" *ngIf="totalPages() > 1">
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

      <!-- Writing Interface -->
      <div class="writing-interface" *ngIf="selectedTask()">
        <div class="writing-main">
          <div class="left-column">
            <!-- Tabs for switching between Question and Guide -->
            <div class="info-tabs">
          <button 
                class="tab-btn" 
                [class.active]="activeInfoTab() === 'question'"
                (click)="activeInfoTab.set('question')">
                📋 Câu hỏi
          </button>
          <button 
                class="tab-btn" 
                [class.active]="activeInfoTab() === 'guide'"
                *ngIf="selectedTask()?.writingGuide"
                (click)="activeInfoTab.set('guide')">
                📝 Hướng dẫn
          </button>
        </div>

            <!-- Question Panel (Compact) -->
            <div class="info-panel" *ngIf="activeInfoTab() === 'question'">
              <div class="task-instruction-panel-compact">
                <div class="task-title-compact">{{ selectedTask()!.title }}</div>
                <ng-container *ngIf="selectedTask()?.instruction">
                  <div class="section-label">Đề bài:</div>
                  <div class="instruction-content-compact">
                    {{ selectedTask()!.instruction }}
                  </div>
                </ng-container>
                
                <!-- Task-specific content -->
                <div *ngIf="selectedTask()?.type === 'task1'" class="task1-content-compact">
                  <!-- Task 1 Image -->
                  <div *ngIf="getTask1ImageUrl()" class="task1-image-compact">
                    <div class="section-label">Hình minh họa:</div>
                    <img [src]="getTask1ImageUrl()" alt="Task 1 Chart/Graph" class="task-image">
                  </div>
                  <div *ngIf="getTask1Description()" class="task-description-compact">
                    <div class="section-label">Mô tả:</div>
                    <div class="section-content">{{ getTask1Description() }}</div>
                  </div>
                </div>
                
                <div *ngIf="selectedTask()?.type === 'task2'" class="task2-content-compact">
                  <div class="main-question-compact">
                    <div class="section-label">Câu hỏi chính:</div>
                    <div class="section-content">{{ getTask2Question() }}</div>
                  </div>
                  <div *ngIf="getTask2AdditionalQuestions()?.length" class="additional-questions-compact">
                    <div class="section-label">Câu hỏi bổ sung:</div>
                    <ul class="compact-list">
                      <li *ngFor="let question of getTask2AdditionalQuestions()">{{ question }}</li>
                    </ul>
                  </div>
                </div>

                <div class="task-requirements-compact">
                  <div class="requirement-item-compact">
                    <span class="label-compact">⏱️</span>
                    <span class="value-compact">{{ selectedTask()!.timeLimit }} phút</span>
                  </div>
                  <div class="requirement-item-compact">
                    <span class="label-compact">📝</span>
                    <span class="value-compact">{{ selectedTask()!.wordCount }} từ</span>
                  </div>
                </div>

                <div *ngIf="selectedTask()!.tips?.length" class="tips-section-compact">
                  <div class="section-label">💡 Mẹo:</div>
                  <ul class="compact-list">
                    <li *ngFor="let tip of selectedTask()!.tips">{{ tip }}</li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Writing Guide Panel (Larger) -->
            <div class="info-panel" *ngIf="activeInfoTab() === 'guide' && selectedTask()?.writingGuide">
              <div class="writing-guide-panel-expanded">
                <div class="writing-guide-content" [innerHTML]="selectedTask()!.writingGuide"></div>
              </div>
            </div>
          </div>

          <div class="writing-area">
            <div class="writing-textarea-container">
            <textarea 
                [ngModel]="currentAnswer()"
                (ngModelChange)="currentAnswer.set($event)"
              placeholder="Viết bài của bạn ở đây..."
              (input)="updateWordCount()"
              class="writing-textarea">
            </textarea>
            </div>
            
            <div class="writing-tools sticky-bar">
              <div class="tools-left">
              <div class="word-counter">
                  <span class="current-words">{{ getCurrentWordCount() }}</span>
                  <span class="word-target">/ {{ selectedTask()!.wordCount }} từ</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="getWordProgress()"></div>
                  </div>
                </div>
              </div>
              <div class="tools-right">
                <div class="timer-section-compact">
                  <div class="timer-compact" [class.warning]="timeLeft() < 300">
                    ⏱️ {{ formatTime(timeLeft()) }}
                  </div>
                  <button class="btn btn-sm btn-timer" (click)="toggleTimer()">
                    {{ isTimerRunning() ? '⏸️ Tạm dừng' : '▶️ Bắt đầu' }}
                  </button>
              </div>
              <div class="writing-actions">
                <button class="btn btn-secondary" (click)="saveDraft()">Lưu nháp</button>
                  <button class="btn btn-primary" (click)="evaluateWriting()" [disabled]="!currentAnswer()">
                    AI Chấm bài
                  </button>
                  <button class="btn btn-success" (click)="submitAnswer()" [disabled]="!currentAnswer()">
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Evaluation Panel -->
        <div class="evaluation-panel" *ngIf="evaluation()">
          <div class="evaluation-header">
            <h3>Kết quả AI Chấm bài</h3>
            <div class="overall-score">
              <span class="score-value">{{ evaluation()!.overallScore }}/9</span>
              <span class="score-label">Điểm tổng</span>
            </div>
          </div>

          <div class="criteria-scores">
            <div class="criteria-item">
              <span class="criteria-name">Task Achievement</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.taskAchievement / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.taskAchievement }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Coherence & Cohesion</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.coherenceCohesion / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.coherenceCohesion }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Lexical Resource</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.lexicalResource / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.lexicalResource }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Grammatical Range</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.grammaticalRange / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.grammaticalRange }}/9</span>
              </div>
            </div>
          </div>

          <div class="feedback-section">
            <h4>Nhận xét chi tiết:</h4>
            <p class="feedback-text">{{ evaluation()!.feedback }}</p>
          </div>

          <div class="suggestions-section">
            <h4>Gợi ý cải thiện:</h4>
            <ul class="suggestions-list">
              <li *ngFor="let suggestion of evaluation()!.suggestions">{{ suggestion }}</li>
            </ul>
          </div>

          <div class="sample-answer-section" *ngIf="selectedTask()!.sampleAnswer">
            <h4>Câu trả lời mẫu:</h4>
            <div class="sample-answer" [innerHTML]="selectedTask()!.sampleAnswer"></div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .writing-container {
      min-height: 100vh;
      background: #f8f9fa;
    }

    .task-selection-panel {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .panel-header {
      margin-bottom: 2rem;
    }

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .header-top h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 1.75rem;
    }

    .header-top p {
      margin: 0;
      color: #6b7280;
      font-size: 0.9375rem;
    }

    .task-filters {
      display: flex;
      gap: 2rem;
      margin-bottom: 2rem;
      justify-content: center;
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .filter-group label {
      font-weight: 500;
      color: #2c3e50;
    }

    .filter-group select {
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      min-width: 120px;
    }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }

    .task-pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 1.5rem;
      flex-wrap: wrap;
    }

    .task-pagination .page-numbers {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .task-pagination .page-btn {
      min-width: 36px;
      background: #e5e7eb;
      color: #1f2937;
      font-size: 0.85rem;
      padding: 0.35rem 0.65rem;
    }

    .task-pagination .page-btn.active {
      background: #3b82f6;
      color: #fff;
      box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
    }

    .task-card {
      background: white;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
      border: 1px solid transparent;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .task-card:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.12);
      border-color: #3b82f6;
    }

    .task-card.completed {
      border-left: 3px solid #22c55e;
    }

    .task-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }

    .task-title {
      margin: 0;
      color: #1f2937;
      font-size: 1rem;
      font-weight: 600;
      flex: 1;
    }

    .completed-badge {
      background: #22c55e;
      color: white;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .task-card-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      align-items: center;
    }

    .chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f1f5f9;
      color: #1e293b;
      line-height: 1;
      white-space: nowrap;
    }

    .task-type-badge.task1 {
      background: #dbeafe;
      color: #1d4ed8;
    }

    .task-type-badge.task2 {
      background: #fee2e2;
      color: #b91c1c;
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
      font-weight: 500;
    }

    .chip-icon {
      font-size: 0.85rem;
    }

    .task-preview {
      color: #475569;
      line-height: 1.45;
      margin: 0;
      font-size: 0.85rem;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .latest-attempt {
      margin: 0;
      padding: 0.6rem 0.75rem;
      background: #f8fafc;
      border-radius: 8px;
      border-left: 3px solid #22c55e;
    }

    .attempt-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .attempt-score {
      font-weight: 600;
      color: #16a34a;
      font-size: 0.85rem;
    }

    .attempt-date {
      font-size: 0.8rem;
      color: #64748b;
    }

    .writing-intro {
      background: #0f172a;
      color: #f8fafc;
      padding: 1.25rem 1.5rem;
      border-radius: 14px;
      margin-top: 1.5rem;
      box-shadow: 0 12px 24px rgba(15, 23, 42, 0.25);
      border: 1px solid rgba(148, 163, 184, 0.2);
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .intro-title {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: 0.02em;
    }

    .intro-line {
      margin: 0;
      font-size: 0.9rem;
      color: #e2e8f0;
      line-height: 1.5;
    }

    .intro-callout {
      margin: 0;
      margin-top: 0.5rem;
      font-size: 0.95rem;
      font-weight: 600;
      color: #f97316;
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
    }

    .intro-callout::before {
      content: "✍️";
    }

    .stats-overview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      margin-top: 1rem;
      padding: 1rem 1.25rem;
      background: #f8fafc;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    .stat-summary {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .summary-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .summary-value {
      font-size: 1.6rem;
      font-weight: 700;
      color: #1d4ed8;
    }

    .summary-sub {
      font-size: 0.85rem;
      color: #475569;
    }

    .stat-divider {
      width: 1px;
      align-self: stretch;
      background: linear-gradient(to bottom, transparent, rgba(148, 163, 184, 0.4), transparent);
    }

    .stat-groups {
      display: grid;
      grid-template-columns: repeat(2, minmax(80px, 1fr));
      gap: 0.75rem;
    }

    .stat-mini {
      background: white;
      border-radius: 10px;
      padding: 0.6rem 0.75rem;
      box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      border: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 0.2rem;
    }

    .mini-label {
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
    }

    .mini-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .task-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .tab-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-weight: 500;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      color: #3b82f6;
    }

    .tab-btn.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }

    .task-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.35rem;
      margin-top: auto;
    }

    .tag {
      background: #eef2ff;
      color: #4338ca;
      padding: 0.2rem 0.45rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 500;
      line-height: 1;
    }

    .writing-interface {
      width: 100%;
      padding: 0;
      margin: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .writing-main {
      display: grid;
      grid-template-columns: 400px 1fr;
      gap: 1.5rem;
      flex: 1;
      padding: 1rem;
      overflow: hidden;
    }

    .left-column {
      display: flex;
      flex-direction: column;
      position: sticky;
      top: 0;
      height: 100%;
      gap: 0;
      overflow: hidden;
    }

    /* Tabs */
    .info-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      background: white;
      padding: 0.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .tab-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .tab-btn:hover {
      background: #f3f4f6;
      color: #374151;
    }

    .tab-btn.active {
      background: #3b82f6;
      color: white;
      box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
    }

    /* Info Panel Container */
    .info-panel {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    /* Compact Task Instruction Panel */
    .task-instruction-panel-compact {
      background: white;
      padding: 1.25rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .task-title-compact {
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .instruction-content-compact {
      margin-bottom: 1rem;
      color: #374151;
      font-size: 0.875rem;
      white-space: pre-line;
    }

    .section-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.5rem;
      margin-top: 1rem;
    }

    .section-content {
      color: #1f2937;
      font-size: 0.875rem;
      line-height: 1.6;
    }

    .task1-image-compact {
      margin: 1rem 0;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .task-image {
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      display: block;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .task-requirements-compact {
      display: flex;
      gap: 1rem;
      margin: 1rem 0;
      padding: 0.75rem;
      background: #f8fafc;
      border-radius: 6px;
      font-size: 0.8125rem;
    }

    .requirement-item-compact {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .label-compact {
      font-size: 1rem;
    }

    .value-compact {
      font-weight: 600;
      color: #3b82f6;
    }

    .tips-section-compact {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      border-left: 3px solid #fbbf24;
    }

    .compact-list {
      margin: 0.5rem 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .compact-list li {
      margin-bottom: 0.375rem;
      color: #374151;
    }

    /* Expanded Writing Guide Panel */
    .writing-guide-panel-expanded {
      background: #fff7ed;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #f97316;
      height: 100%;
      overflow-y: auto;
    }

    .writing-guide-content {
      line-height: 1.7;
      color: #1f2937;
      font-size: 0.875rem;
    }

    .writing-guide-content ::ng-deep h2 {
      color: #ea580c;
      font-size: 1rem;
      margin: 1.25rem 0 0.75rem 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .writing-guide-content ::ng-deep h3 {
      color: #f97316;
      font-size: 0.9375rem;
      margin: 1rem 0 0.5rem 0;
      font-weight: 600;
      line-height: 1.4;
    }

    .writing-guide-content ::ng-deep ul,
    .writing-guide-content ::ng-deep ol {
      padding-left: 1.25rem;
      margin: 0.5rem 0;
    }

    .writing-guide-content ::ng-deep li {
      margin-bottom: 0.375rem;
      line-height: 1.6;
      font-size: 0.875rem;
    }

    .writing-guide-content ::ng-deep strong {
      font-weight: 600;
      color: #1f2937;
    }

    .writing-guide-content ::ng-deep em {
      font-style: italic;
    }

    .writing-guide-content ::ng-deep a {
      color: #3b82f6;
      text-decoration: underline;
      font-size: 0.875rem;
    }

    .writing-guide-content ::ng-deep p {
      margin: 0.5rem 0;
      font-size: 0.875rem;
    }

    /* Responsive */
    @media (max-width: 1024px) {
      .writing-main {
        grid-template-columns: 350px 1fr;
      }

      .writing-tools.sticky-bar {
        left: calc(350px + 1.5rem + 1rem);
        width: calc(100vw - 350px - 1.5rem - 2rem);
      }
    }

    @media (max-width: 768px) {
      .writing-main {
        grid-template-columns: 1fr;
      }

      .left-column {
        position: relative;
        height: auto;
        max-height: 400px;
        margin-bottom: 1rem;
      }

      .info-panel {
        max-height: 350px;
      }

      .writing-tools {
        flex-direction: column;
        gap: 1rem;
        padding: 0.75rem;
      }

      .writing-tools.sticky-bar {
        left: 0;
        right: 0;
        width: 100vw;
        border-radius: 0;
      }

      .tools-left,
      .tools-right {
        width: 100%;
      }

      .tools-right {
        flex-direction: column;
        align-items: stretch;
      }

      .timer-section-compact {
        justify-content: space-between;
      }

      .writing-actions {
        flex-wrap: wrap;
      }

      .writing-actions .btn {
        flex: 1;
        min-width: 100px;
      }
    }

    .task-requirements {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1.5rem;
    }

    .requirement-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .requirement-item .label {
      font-weight: 500;
      color: #2c3e50;
    }

    .tips-section {
      background: #fff3cd;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }

    .tips-section h4 {
      margin: 0 0 0.5rem 0;
      color: #856404;
    }

    .tips-section ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .writing-area {
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      position: relative;
    }

    .writing-textarea-container {
      flex: 1;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow-y: auto;
      overflow-x: hidden;
      display: flex;
      flex-direction: column;
      min-height: 0;
      margin-bottom: 80px; /* Space for fixed writing-tools */
    }

    .writing-textarea {
      width: 100%;
      height: 100%;
      padding: 1.5rem;
      border: none;
      font-size: 1rem;
      line-height: 1.6;
      resize: none;
      font-family: 'Times New Roman', serif;
      outline: none;
    }

    .writing-tools {
      background: white;
      padding: 1rem;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      margin-top: 1rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      z-index: 100;
    }

    .writing-tools.sticky-bar {
      position: fixed;
      bottom: 0;
      left: calc(400px + 1.5rem + 1rem); /* left-column + gap + padding */
      right: 1rem;
      width: calc(100vw - 400px - 1.5rem - 2rem); /* full width - left-column - gap - paddings */
      margin: 0;
      border-radius: 8px 8px 0 0;
    }

    .tools-left {
      display: flex;
      align-items: center;
      flex: 1;
    }

    .tools-right {
      display: flex;
      align-items: center;
      gap: 1.5rem;
    }

    .word-counter {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin: 0;
    }

    .current-words {
      font-weight: bold;
      color: #007bff;
      font-size: 1rem;
    }

    .word-target {
      color: #6b7280;
      font-size: 0.875rem;
    }

    .progress-bar {
      width: 120px;
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-left: 0.5rem;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      transition: width 0.3s ease;
    }

    .timer-section-compact {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }

    .timer-compact {
      font-size: 1rem;
      font-weight: 600;
      color: #374151;
      white-space: nowrap;
    }

    .timer-compact.warning {
      color: #dc2626;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    .btn-timer {
      padding: 0.375rem 0.75rem;
      font-size: 0.8125rem;
      border: 1px solid #d1d5db;
      background: white;
      color: #374151;
      white-space: nowrap;
    }

    .btn-timer:hover {
      background: #f3f4f6;
      border-color: #9ca3af;
    }

    .writing-actions {
      display: flex;
      gap: 0.5rem;
    }

    .evaluation-panel {
      grid-column: 1 / -1;
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-top: 2rem;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e9ecef;
    }

    .overall-score {
      text-align: center;
    }

    .score-value {
      font-size: 2rem;
      font-weight: bold;
      color: #28a745;
      display: block;
    }

    .score-label {
      font-size: 0.9rem;
      color: #666;
    }

    .criteria-scores {
      margin-bottom: 2rem;
    }

    .criteria-item {
      margin-bottom: 1rem;
    }

    .criteria-name {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #2c3e50;
    }

    .score-bar {
      position: relative;
      height: 20px;
      background: #e9ecef;
      border-radius: 10px;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #28a745, #20c997);
      transition: width 0.3s ease;
    }

    .score-text {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 0.8rem;
      font-weight: bold;
      color: white;
    }

    .feedback-section,
    .suggestions-section,
    .sample-answer-section {
      margin-bottom: 2rem;
    }

    .feedback-section h4,
    .suggestions-section h4,
    .sample-answer-section h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .feedback-text {
      line-height: 1.6;
      color: #666;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 1.5rem;
    }

    .suggestions-list li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .sample-answer {
      background: #f8f9fa;
      padding: 1rem;
      border-radius: 8px;
      line-height: 1.6;
      font-style: italic;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background: #218838;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .writing-main {
        grid-template-columns: 1fr;
      }

      .writing-intro {
        padding: 1.1rem 1.25rem;
        gap: 0.6rem;
      }

      .stats-overview {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      .stat-divider {
        width: 100%;
        height: 1px;
      }

      .stat-groups {
        grid-template-columns: repeat(2, 1fr);
      }

      .task-grid {
        grid-template-columns: 1fr;
      }

      .task-pagination {
        flex-direction: column;
        gap: 0.75rem;
      }

      .task-pagination .page-numbers {
        justify-content: center;
      }

      .task-filters {
        flex-direction: column;
        align-items: center;
      }

      .header-top {
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
    }
    .history-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #2563eb, #1e40af);
      color: #f8fafc;
      padding: 0.7rem 1.4rem;
      border-radius: 999px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.9rem;
      box-shadow: 0 12px 24px rgba(37, 99, 235, 0.28);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      letter-spacing: 0.02em;
      border: none;
    }

    .history-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 16px 30px rgba(37, 99, 235, 0.32);
      color: #fff;
    }

    .history-icon {
      font-size: 1.15rem;
      line-height: 1;
    }

    @media (max-width: 768px) {
      .history-btn {
        padding: 0.6rem 1.2rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class WritingComponent implements OnInit, OnDestroy {
  private writingService = inject(WritingTaskService);
  private historyService = inject(WritingHistoryService);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();

  // Signals
  timeLeft = signal(3600); // 60 minutes total
  isTimerRunning = signal(false);
  selectedTask = signal<WritingTask | null>(null);
  evaluation = signal<AIEvaluation | null>(null);
  currentAnswer = signal('');
  currentPage = signal(1);
  itemsPerPage = 9;
  
  // Filter state
  selectedType = '';
  selectedDifficulty = '';
  activeTab = signal<'uncompleted' | 'completed'>('uncompleted');
  activeInfoTab = signal<'question' | 'guide'>('question'); // Tab for switching between question and guide

  // Computed values
  filteredTasks = computed(() => {
    const tasks = this.writingService.sortedTasks();
    const completedIds = this.historyService.completedTaskIds();
    
    let filteredTasks = tasks.filter(task => {
      if (this.selectedType && task.type !== this.selectedType) return false;
      if (this.selectedDifficulty && task.difficulty !== this.selectedDifficulty) return false;
      return task.isActive;
    });

    // Filter based on active tab
    if (this.activeTab() === 'completed') {
      filteredTasks = filteredTasks.filter(task => completedIds.includes(Number(task.id)));
        } else {
      filteredTasks = filteredTasks.filter(task => !completedIds.includes(Number(task.id)));
    }

    return filteredTasks;
  });

  totalPages = computed(() => {
    const count = this.filteredTasks().length;
    return count === 0 ? 0 : Math.ceil(count / this.itemsPerPage);
  });

  paginatedTasks = computed(() => {
    const tasks = this.filteredTasks();
    if (tasks.length === 0) {
      return [];
    }
    const totalPages = Math.max(1, Math.ceil(tasks.length / this.itemsPerPage));
    const current = Math.min(Math.max(this.currentPage(), 1), totalPages);
    const start = (current - 1) * this.itemsPerPage;
    return tasks.slice(start, start + this.itemsPerPage);
  });

  // Computed values for stats
  userStats = computed(() => this.historyService.userStats());
  completedCount = computed(() => this.historyService.completedTaskIds().length);
  uncompletedCount = computed(() => {
    const tasks = this.writingService.sortedTasks();
    const completedIds = this.historyService.completedTaskIds();
    return tasks.filter(task => {
      if (this.selectedType && task.type !== this.selectedType) return false;
      if (this.selectedDifficulty && task.difficulty !== this.selectedDifficulty) return false;
      return task.isActive && !completedIds.includes(Number(task.id));
    }).length;
  });

  ngOnInit() {
    // Subscribe to tasks changes
    this.writingService.tasks$
      .pipe(takeUntil(this.destroy$))
      .subscribe(tasks => {
        // Tasks are automatically updated when admin makes changes
        console.log('Tasks updated:', tasks);
        this.ensurePaginationBounds();
        
        // Check if there's a taskId in URL parameters for retaking
        this.route.queryParams.subscribe(params => {
          if (params['taskId']) {
            const taskId = params['taskId'];
            const task = tasks.find(t => t.id === taskId);
            if (task) {
              this.selectTask(task);
            }
          }
        });
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setActiveTab(tab: 'uncompleted' | 'completed'): void {
    if (this.activeTab() !== tab) {
      this.activeTab.set(tab);
      this.resetPagination();
      this.ensurePaginationBounds();
    }
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

  private ensurePaginationBounds(): void {
    const total = this.totalPages();
    if (total === 0) {
      this.currentPage.set(1);
      return;
    }
    const current = this.currentPage();
    if (current > total) {
      this.currentPage.set(total);
    } else if (current < 1) {
      this.currentPage.set(1);
    }
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleTimer(): void {
    this.isTimerRunning.set(!this.isTimerRunning());
    
    if (this.isTimerRunning()) {
      // Start timer
      const interval = setInterval(() => {
        if (this.isTimerRunning()) {
          const current = this.timeLeft();
          if (current > 0) {
            this.timeLeft.set(current - 1);
          } else {
            this.submitAnswer();
            clearInterval(interval);
          }
        } else {
          clearInterval(interval);
        }
      }, 1000);
    }
  }

  selectTask(task: WritingTask): void {
    this.selectedTask.set(task);
    this.currentAnswer.set('');
    this.evaluation.set(null);
    this.timeLeft.set(task.timeLimit * 60); // Convert minutes to seconds
    this.isTimerRunning.set(false);
  }

  backToSelection(): void {
    this.selectedTask.set(null);
    this.currentAnswer.set('');
    this.evaluation.set(null);
    this.isTimerRunning.set(false);
  }

  onFilterChange(): void {
    this.resetPagination();
  }

  getTaskPreview(task: WritingTask): string {
    const text = task.instruction.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return text.length > 150 ? text.substring(0, 150) + '...' : text;
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    return labels[difficulty] || difficulty;
  }

  getTask1Description(): string | null {
    const task = this.selectedTask();
    if (task?.type === 'task1') {
      return (task as WritingTask1).description || null;
    }
    return null;
  }

  getTask1ImageUrl(): string | null {
    const task = this.selectedTask();
    if (task?.type === 'task1') {
      return (task as WritingTask1).imageUrl || null;
    }
    return null;
  }

  getTask2Question(): string {
    const task = this.selectedTask();
    if (task?.type === 'task2') {
      return (task as WritingTask2).question || '';
    }
    return '';
  }

  getTask2AdditionalQuestions(): string[] {
    const task = this.selectedTask();
    if (task?.type === 'task2') {
      return (task as WritingTask2).additionalQuestions || [];
    }
    return [];
  }

  getCurrentWordCount(): number {
    return this.currentAnswer().trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  getWordProgress(): number {
    const current = this.getCurrentWordCount();
    const target = this.selectedTask()?.wordCount || 1;
    return Math.min((current / target) * 100, 100);
  }

  updateWordCount(): void {
    // Word count is calculated in getCurrentWordCount()
  }

  saveDraft(): void {
    const taskId = this.selectedTask()?.id;
    const answer = this.currentAnswer();
    
    if (taskId && answer) {
      localStorage.setItem(`writing_draft_${taskId}`, answer);
    alert('Đã lưu nháp thành công!');
    }
  }

  evaluateWriting(): void {
    const answer = this.currentAnswer();
    if (!answer.trim()) {
      alert('Vui lòng viết nội dung trước khi chấm bài!');
      return;
    }

    // Simulate AI evaluation
    const mockEvaluation: AIEvaluation = {
      overallScore: Math.floor(Math.random() * 3) + 6, // 6-8
      taskAchievement: Math.floor(Math.random() * 3) + 6,
      coherenceCohesion: Math.floor(Math.random() * 3) + 6,
      lexicalResource: Math.floor(Math.random() * 3) + 6,
      grammaticalRange: Math.floor(Math.random() * 3) + 6,
      feedback: `Bài viết của bạn có cấu trúc tốt và đáp ứng yêu cầu của đề bài. Tuy nhiên, cần cải thiện về từ vựng và ngữ pháp để đạt điểm cao hơn.`,
      suggestions: [
        'Sử dụng nhiều từ vựng học thuật hơn',
        'Cải thiện cấu trúc câu phức tạp',
        'Thêm các liên từ để kết nối ý tưởng',
        'Chú ý đến dấu câu và chính tả'
      ],
      sampleAnswer: this.selectedTask()?.sampleAnswer || 'Câu trả lời mẫu sẽ được hiển thị ở đây.'
    };

    this.evaluation.set(mockEvaluation);
  }

  submitAnswer(): void {
    const answer = this.currentAnswer();
    const wordCount = this.getCurrentWordCount();
    const target = this.selectedTask()?.wordCount || 0;
    const timeSpent = this.selectedTask()?.timeLimit ? (this.selectedTask()!.timeLimit * 60 - this.timeLeft()) : 0;
    
    if (wordCount < target) {
      alert(`Bài viết của bạn có ${wordCount} từ, cần ít nhất ${target} từ.`);
      return;
    }
    
    const submitDto = {
      taskId: Number(this.selectedTask()!.id),
      answer: answer,
      wordCount: wordCount,
      timeSpent: timeSpent,
      aiScore: this.evaluation()?.overallScore,
      taskAchievement: this.evaluation()?.taskAchievement,
      coherenceCohesion: this.evaluation()?.coherenceCohesion,
      lexicalResource: this.evaluation()?.lexicalResource,
      grammaticalRange: this.evaluation()?.grammaticalRange,
      aiFeedback: this.evaluation()?.feedback,
      aiSuggestions: this.evaluation()?.suggestions
    };
    
    this.historyService.submitWriting(submitDto).subscribe({
      next: (result) => {
        console.log('Answer submitted successfully:', result);
        alert(`Bạn đã nộp bài thành công với ${wordCount} từ!`);
        
        // Reset form
        this.currentAnswer.set('');
        this.evaluation.set(null);
        this.backToSelection();
      },
      error: (error) => {
        console.error('Error submitting answer:', error);
        alert('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
      }
    });
  }

  isTaskCompleted(task: WritingTask): boolean {
    return this.historyService.isTaskCompleted(Number(task.id));
  }

  getLatestAttempt(task: WritingTask): any {
    return this.historyService.getLatestAttempt(Number(task.id));
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('vi-VN');
  }
}
