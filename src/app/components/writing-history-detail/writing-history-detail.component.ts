import { Component, OnInit, AfterViewInit, inject, signal, computed, ViewChildren, QueryList, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { WritingHistoryService } from '../../services/writing-history.service';
import { WritingTaskService } from '../../services/writing-task.service';
import { AiCorrection, WritingHistoryDto } from '../../services/writing-history-api.service';

type NormalizedCorrection = AiCorrection & { id: string };

type AnnotatedSegment =
  | { kind: 'text'; text: string }
  | { kind: 'correction'; text: string; correction: NormalizedCorrection };

interface AnnotatedContent {
  segments: AnnotatedSegment[];
  resolvedCorrectionIds: string[];
  unresolvedCorrectionIds: string[];
  wordCount: number;
}
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
        <!-- AI Scoring Panel - Above the essay -->
        <div class="evaluation-panel" *ngIf="historyItem()!.aiScore">
          <div class="evaluation-header">
            <div class="evaluation-title-section">
              <h3>Kết quả AI Chấm bài</h3>
              <div class="evaluation-meta" *ngIf="historyItem()!.aiProvider || historyItem()!.aiEvaluatedAt">
                <span *ngIf="historyItem()!.aiProvider">
                  🤖 {{ historyItem()!.aiProvider }}<ng-container *ngIf="historyItem()!.aiModel"> ({{ historyItem()!.aiModel }})</ng-container>
                </span>
                <span *ngIf="historyItem()!.aiEvaluatedAt">
                  🕒 {{ formatDate(historyItem()!.aiEvaluatedAt!) }}
                </span>
              </div>
            </div>
            <div class="overall-score">
              <span class="score-value">{{ historyItem()!.aiScore!.toFixed(1) }}</span>
              <span class="score-label">Điểm tổng / 9.0</span>
            </div>
          </div>

          <div class="criteria-scores">
            <div class="criteria-item" *ngIf="historyItem()!.taskAchievement">
              <div class="criteria-header">
                <span class="criteria-name">Task Achievement</span>
                <span class="criteria-score-value">{{ historyItem()!.taskAchievement!.toFixed(1) }}/9</span>
              </div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.taskAchievement! / 9) * 100"></div>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.coherenceCohesion">
              <div class="criteria-header">
                <span class="criteria-name">Coherence & Cohesion</span>
                <span class="criteria-score-value">{{ historyItem()!.coherenceCohesion!.toFixed(1) }}/9</span>
              </div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.coherenceCohesion! / 9) * 100"></div>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.lexicalResource">
              <div class="criteria-header">
                <span class="criteria-name">Lexical Resource</span>
                <span class="criteria-score-value">{{ historyItem()!.lexicalResource!.toFixed(1) }}/9</span>
              </div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.lexicalResource! / 9) * 100"></div>
              </div>
            </div>
            <div class="criteria-item" *ngIf="historyItem()!.grammaticalRange">
              <div class="criteria-header">
                <span class="criteria-name">Grammatical Range</span>
                <span class="criteria-score-value">{{ historyItem()!.grammaticalRange!.toFixed(1) }}/9</span>
              </div>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(historyItem()!.grammaticalRange! / 9) * 100"></div>
              </div>
            </div>
          </div>
        </div>

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
              <div class="review-header" *ngIf="aiCorrections().length">
                <div class="review-meta">
                  <span>{{ aiCorrections().length }} gợi ý sửa lỗi từ AI</span>
                  <div class="review-legend">
                    <span class="legend-item">
                      <span class="legend-swatch swatch-grammar"></span>
                      Sai ngữ pháp cần sửa
                    </span>
                    <span class="legend-item">
                      <span class="legend-swatch swatch-style"></span>
                      Gợi ý diễn đạt hay hơn
                    </span>
                    <span class="legend-item">
                      <span class="legend-swatch swatch-addition"></span>
                      Nên bổ sung nội dung
                    </span>
                  </div>
                  <span class="review-tip">Di chuột hoặc nhấn vào thẻ gợi ý bên dưới để xem highlight tương ứng.</span>
                </div>
              </div>

              <div class="writing-display" [class.show-corrections]="aiCorrections().length > 0">
                <div class="essay-heading">
                  <span class="essay-title">Bài viết gốc</span>
                  <span class="essay-subtitle" *ngIf="historyItem()?.wordCount">
                    {{ historyItem()!.wordCount }} từ
                  </span>
                </div>
                <div class="essay-content">
                  <ng-container *ngFor="let segment of annotatedContent().segments; trackBy: trackSegment">
                    <span
                      *ngIf="segment.kind === 'text'"
                      class="essay-text">
                      {{ segment.text }}
                    </span>
                    <span
                      *ngIf="segment.kind === 'correction'"
                      class="essay-text"
                      [ngClass]="getHighlightClasses(segment.correction)"
                      [class.active]="activeCorrectionId() === segment.correction.id"
                      #highlightRef
                      [attr.data-correction-id]="segment.correction.id"
                      (mouseenter)="focusCorrection(segment.correction.id)"
                      (mouseleave)="clearCorrectionFocus()"
                      (click)="onHighlightClick(segment.correction.id, $event)">
                      {{ segment.text }}
                    </span>
                  </ng-container>
                </div>
              </div>
            </div>

            <!-- Correction Selection Menu -->
            <div class="correction-selection-menu" 
                 *ngIf="overlappingCorrections()"
                 [style.left.px]="overlappingCorrections()!.clickX"
                 [style.top.px]="overlappingCorrections()!.clickY">
              <div class="menu-header">
                <span>Chọn phần chữa bài:</span>
                <button class="menu-close" (click)="overlappingCorrections.set(null)">×</button>
              </div>
              <div class="menu-items">
                <button 
                  *ngFor="let correction of overlappingCorrections()!.corrections"
                  class="menu-item"
                  (click)="selectCorrectionFromMenu(correction.id)">
                  <div class="menu-item-header">
                    <span class="menu-item-type">{{ mapIssueType(correction.issueType) }}</span>
                    <span class="menu-item-severity" [class]="correction.severity || 'low'">
                      {{ mapSeverity(correction.severity) }}
                    </span>
                  </div>
                  <div class="menu-item-summary" *ngIf="correction.summary">
                    {{ correction.summary }}
                  </div>
                  <div class="menu-item-text">
                    <span class="menu-item-label">Đoạn gốc:</span>
                    <span class="menu-item-original">{{ correction.originalText }}</span>
                  </div>
                </button>
              </div>
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

        <!-- AI Corrections Panel - Full width below essay -->
        <div class="corrections-panel-full" *ngIf="aiCorrections().length">
          <div class="corrections-header-full">
            <div class="corrections-title-section">
              <h3>AI góp ý sửa bài</h3>
              <span class="corrections-count">{{ aiCorrections().length }} gợi ý</span>
            </div>
          </div>
          <!-- Scrollable corrections list -->
          <div class="corrections-list-scrollable">
            <div class="corrections-list-full">
              <div
                class="correction-card"
                *ngFor="let correction of aiCorrections(); let idx = index"
                [class.active]="activeCorrectionId() === correction.id"
                [ngClass]="getCorrectionCardClasses(correction)"
                #correctionCard
                [attr.data-correction-id]="correction.id"
                (mouseenter)="focusCorrection(correction.id)"
                (mouseleave)="clearCorrectionFocus()"
                (click)="toggleCorrectionFocus(correction.id)">
                <div class="correction-chip-group">
                  <span class="correction-index">#{{ idx + 1 }}</span>
                  <span class="correction-type">{{ mapIssueType(correction.issueType) }}</span>
                  <span
                    class="correction-severity"
                    [class.high]="correction.severity === 'high'"
                    [class.medium]="correction.severity === 'medium'"
                    [class.low]="correction.severity === 'low' || !correction.severity">
                    {{ mapSeverity(correction.severity) }}
                  </span>
                </div>

                <div class="correction-summary" *ngIf="correction.summary">
                  {{ correction.summary }}
                </div>

                <div class="correction-section" *ngIf="correction.originalText">
                  <div class="section-label">Đoạn gốc</div>
                  <p>{{ correction.originalText }}</p>
                </div>

                <div class="correction-section" *ngIf="correction.suggestedText">
                  <div class="section-label">Gợi ý viết lại</div>
                  <p>{{ correction.suggestedText }}</p>
                </div>

                <div class="correction-section" *ngIf="correction.explanation">
                  <div class="section-label">Lý do</div>
                  <p>{{ correction.explanation }}</p>
                </div>

                <div class="correction-note info" *ngIf="!correction.summary && !correction.suggestedText && !correction.explanation">
                  AI chưa cung cấp chi tiết cụ thể cho gợi ý này. Vui lòng tham khảo highlight trong bài viết.
                </div>

                <button class="back-to-highlight" (click)="scrollToHighlight(correction.id); $event.stopPropagation()">⬆ Quay lại đoạn tô màu</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Corrected Essay Panel - Full width below corrections -->
        <div class="corrected-essay-panel-full" *ngIf="getCorrectedEssay()">
          <div class="corrected-header-full">
            <div class="corrected-title-section">
              <h3>Phiên bản hoàn chỉnh theo AI</h3>
              <span class="corrected-note">Tổng hợp các gợi ý sửa bài bên trên</span>
            </div>
          </div>
          <div class="corrected-content-full">
            <div class="corrected-text">{{ getCorrectedEssay() }}</div>
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
      align-items: start;
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
      gap: 1rem;
    }

    .writing-textarea-container {
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      padding: 1.5rem;
      flex: 0 0 auto;
    }

    .writing-display {
      background: #ffffff;
      border-radius: 12px;
      padding: 1.25rem;
      min-height: auto;
      max-height: none;
      overflow-y: visible;
      border: 1px solid transparent;
      transition: border 0.2s ease, box-shadow 0.2s ease;
    }

    .writing-display.show-corrections {
      border-color: rgba(250, 204, 21, 0.4);
      box-shadow: 0 12px 28px rgba(250, 204, 21, 0.18);
    }

    .essay-content {
      font-family: 'Times New Roman', serif;
      font-size: 1rem;
      line-height: 1.65;
      color: #0f172a;
      white-space: pre-wrap;
      word-break: break-word;
    }

    .essay-text {
      display: inline;
    }

    .essay-heading {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .essay-title {
      font-size: 1rem;
      font-weight: 700;
      color: #0f172a;
    }

    .essay-subtitle {
      font-size: 0.8rem;
      font-weight: 500;
      color: #64748b;
    }

    .ai-highlight {
      padding: 0 2px;
      border-radius: 4px;
      transition: background 0.2s ease, box-shadow 0.2s ease, border 0.2s ease;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }

    .ai-highlight.highlight-grammar {
      background: rgba(254, 202, 202, 0.55);
      border-bottom-color: rgba(220, 38, 38, 0.9);
    }

    .ai-highlight.highlight-style {
      background: rgba(226, 232, 240, 0.8);
      border-bottom-color: rgba(100, 116, 139, 0.85);
    }

    .ai-highlight.highlight-addition {
      background: rgba(167, 243, 208, 0.65);
      border-bottom-color: rgba(22, 163, 74, 0.9);
    }

    .ai-highlight:hover,
    .ai-highlight.active {
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
    }

    .ai-highlight.highlight-pulse {
      animation: highlightPulse 1.5s ease-in-out;
      box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.6), 0 0 20px rgba(59, 130, 246, 0.4);
      z-index: 10;
      position: relative;
    }

    @keyframes highlightPulse {
      0% {
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.8), 0 0 30px rgba(59, 130, 246, 0.6);
        transform: scale(1.02);
      }
      50% {
        box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.6), 0 0 25px rgba(59, 130, 246, 0.5);
        transform: scale(1.03);
      }
      100% {
        box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.35);
        transform: scale(1);
      }
    }

    .review-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .review-meta {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      font-size: 0.85rem;
      color: #475569;
    }

    .review-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0.6rem;
      font-size: 0.78rem;
      color: #475569;
    }

    .legend-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.5rem;
      background: #f8fafc;
      border-radius: 999px;
    }

    .legend-swatch {
      width: 14px;
      height: 14px;
      border-radius: 999px;
      border: 1px solid rgba(148, 163, 184, 0.4);
    }

    .swatch-grammar {
      background: rgba(248, 113, 113, 0.85);
      border-color: rgba(220, 38, 38, 0.7);
    }

    .swatch-style {
      background: rgba(226, 232, 240, 0.95);
      border-color: rgba(100, 116, 139, 0.7);
    }

    .swatch-addition {
      background: rgba(167, 243, 208, 0.9);
      border-color: rgba(34, 197, 94, 0.65);
    }

    .review-tip {
      font-size: 0.8rem;
      color: #0ea5e9;
      font-weight: 600;
    }

    .empty-corrected {
      margin: 0;
      font-style: italic;
      color: #64748b;
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

    /* Evaluation Panel - Above essay */
    .evaluation-panel {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(102, 126, 234, 0.25);
      padding: 2rem;
      margin-bottom: 2rem;
      color: white;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .evaluation-title-section h3 {
      margin: 0 0 0.75rem 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
    }

    .evaluation-meta {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      font-size: 0.85rem;
      color: rgba(255, 255, 255, 0.9);
    }

    .evaluation-meta span {
      background: rgba(255, 255, 255, 0.15);
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      backdrop-filter: blur(10px);
    }

    .overall-score {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.2);
      backdrop-filter: blur(10px);
      padding: 1.5rem 2rem;
      border-radius: 16px;
      border: 1px solid rgba(255, 255, 255, 0.3);
    }

    .score-value {
      font-size: 3rem;
      font-weight: 800;
      line-height: 1;
      color: white;
    }

    .score-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.9);
      margin-top: 0.5rem;
      font-weight: 500;
    }

    .criteria-scores {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.25rem;
    }

    .criteria-item {
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(10px);
      padding: 1.25rem;
      border-radius: 12px;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .criteria-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .criteria-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.95);
    }

    .criteria-score-value {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.3rem 0.6rem;
      border-radius: 8px;
    }

    .score-bar {
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 999px;
      overflow: hidden;
      position: relative;
    }

    .score-fill {
      height: 100%;
      background: linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%);
      border-radius: 999px;
      transition: width 0.6s ease;
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
    }

    .corrections-panel {
      margin-top: 1.5rem;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* Full width corrections panel */
    .corrections-panel-full {
      width: 100%;
      margin-top: 2rem;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      max-height: calc(100vh - 100px); /* Limit total height, allow more space */
    }

    /* Scrollable corrections list container */
    .corrections-list-scrollable {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      max-height: 900px; /* Max height to show more corrections per screen */
      padding-right: 0.5rem;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }

    .corrections-list-scrollable::-webkit-scrollbar {
      width: 6px;
    }

    .corrections-list-scrollable::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .corrections-list-scrollable::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .corrections-list-scrollable::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .corrections-header-full {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .corrections-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .corrections-title-section h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .corrections-count {
      font-weight: 600;
      font-size: 0.9rem;
      color: #2563eb;
      background: #eff6ff;
      padding: 0.3rem 0.8rem;
      border-radius: 999px;
      display: inline-block;
    }

    .corrections-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .corrections-header h3 {
      margin: 0;
      font-size: 1.15rem;
      color: #0f172a;
    }

    .corrections-header span {
      font-weight: 600;
      font-size: 0.85rem;
      color: #2563eb;
    }

    .corrections-list-full {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .corrections-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      max-height: 420px;
      overflow-y: auto;
      padding-right: 0.5rem;
    }

    .correction-card {
      background: #f8fafc;
      padding: 1rem;
      border-radius: 12px;
      border: 1px solid transparent;
      transition: border 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .correction-card.type-grammar {
      border-color: rgba(220, 38, 38, 0.35);
      background: rgba(254, 226, 226, 0.5);
    }

    .correction-card.type-style {
      border-color: rgba(100, 116, 139, 0.25);
      background: rgba(241, 245, 249, 0.6);
    }

    .correction-card.type-addition {
      border-color: rgba(34, 197, 94, 0.3);
      background: rgba(220, 252, 231, 0.55);
    }

    .correction-card:hover,
    .correction-card.active {
      border-color: rgba(59, 130, 246, 0.45);
      box-shadow: 0 12px 24px rgba(59, 130, 246, 0.18);
    }

    .correction-chip-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
      font-size: 0.8rem;
      color: #475569;
    }

    .correction-index {
      background: #e0f2fe;
      color: #0369a1;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-weight: 700;
    }

    .correction-type {
      background: #ede9fe;
      color: #5b21b6;
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-weight: 600;
    }

    .correction-severity {
      padding: 0.25rem 0.6rem;
      border-radius: 999px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .correction-severity.high {
      background: #fee2e2;
      color: #b91c1c;
    }

    .correction-severity.medium {
      background: #fef3c7;
      color: #b45309;
    }

    .correction-severity.low {
      background: #dcfce7;
      color: #166534;
    }

    .correction-summary {
      font-weight: 600;
      color: #0f172a;
    }

    .correction-section .section-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      color: #94a3b8;
      margin-bottom: 0.3rem;
      letter-spacing: 0.05em;
    }

    .correction-section p {
      margin: 0;
      font-size: 0.9rem;
      line-height: 1.6;
      color: #1f2937;
    }

    .correction-note.warning {
      font-size: 0.75rem;
      color: #b45309;
      background: #fff7ed;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
    }

    .correction-note.info {
      font-size: 0.75rem;
      color: #1f2937;
      background: #e2e8f0;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
    }

    .back-to-highlight {
      margin-top: 0.5rem;
      padding: 0.4rem 0.75rem;
      border: none;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      background: #e0f2fe;
      color: #0369a1;
      transition: background 0.2s ease, color 0.2s ease;
    }

    .back-to-highlight:hover {
      background: #bae6fd;
      color: #0c4a6e;
    }

    .corrected-essay-panel {
      margin-top: 1.75rem;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 18px 35px rgba(15, 23, 42, 0.12);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Full width corrected essay panel */
    .corrected-essay-panel-full {
      width: 100%;
      margin-top: 2rem;
      background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.12);
      padding: 2rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      border: 1px solid #e2e8f0;
    }

    .corrected-header-full {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .corrected-title-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .corrected-title-section h3 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
    }

    .corrected-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      gap: 0.75rem;
    }

    .corrected-header h3 {
      margin: 0;
      font-size: 1.1rem;
      color: #0f172a;
    }

    .corrected-note {
      font-size: 0.9rem;
      font-weight: 500;
      color: #64748b;
      background: #f1f5f9;
      padding: 0.4rem 0.8rem;
      border-radius: 8px;
      display: inline-block;
    }

    .corrected-content-full {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
    }

    .corrected-text {
      font-family: 'Inter', sans-serif;
      font-size: 1rem;
      line-height: 1.8;
      color: #1f2937;
      white-space: pre-wrap;
      word-wrap: break-word;
    }

    .corrected-content {
      font-family: 'Inter', sans-serif;
      line-height: 1.7;
      color: #1f2937;
      white-space: pre-wrap;
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

      .writing-display {
        max-height: none;
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

      .corrections-list {
        max-height: 340px;
      }


      .correction-selection-menu {
        max-width: 90vw;
      }

      .evaluation-panel {
        padding: 1.5rem;
      }

      .evaluation-header {
        flex-direction: column;
        gap: 1.5rem;
      }

      .criteria-scores {
        grid-template-columns: 1fr;
      }

      .corrections-panel-full,
      .corrected-essay-panel-full {
        padding: 1.5rem;
      }
    }

    .correction-selection-menu {
      position: fixed;
      background: white;
      border-radius: 12px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.15);
      z-index: 1000;
      min-width: 320px;
      max-width: 500px;
      max-height: 70vh;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      animation: menuFadeIn 0.2s ease-out;
    }

    @keyframes menuFadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .menu-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 12px 12px 0 0;
    }

    .menu-header span {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.9rem;
    }

    .menu-close {
      background: transparent;
      border: none;
      font-size: 1.5rem;
      color: #6b7280;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background 0.2s, color 0.2s;
    }

    .menu-close:hover {
      background: #e5e7eb;
      color: #1f2937;
    }

    .menu-items {
      display: flex;
      flex-direction: column;
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .menu-item {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      cursor: pointer;
      text-align: left;
      transition: all 0.2s ease;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .menu-item:hover {
      background: #f8fafc;
      border-color: #3b82f6;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
      transform: translateY(-1px);
    }

    .menu-item-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .menu-item-type {
      background: #ede9fe;
      color: #5b21b6;
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .menu-item-severity {
      padding: 0.2rem 0.5rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .menu-item-severity.high {
      background: #fee2e2;
      color: #b91c1c;
    }

    .menu-item-severity.medium {
      background: #fef3c7;
      color: #b45309;
    }

    .menu-item-severity.low {
      background: #dcfce7;
      color: #166534;
    }

    .menu-item-summary {
      font-weight: 600;
      color: #1f2937;
      font-size: 0.85rem;
    }

    .menu-item-text {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.8rem;
    }

    .menu-item-label {
      color: #6b7280;
      font-weight: 500;
      font-size: 0.75rem;
    }

    .menu-item-original {
      color: #1f2937;
      font-style: italic;
      background: #f8fafc;
      padding: 0.4rem 0.6rem;
      border-radius: 6px;
      border-left: 3px solid #3b82f6;
    }
  `]
})
export class WritingHistoryDetailComponent implements OnInit, AfterViewInit {
  private historyService = inject(WritingHistoryService);
  private writingService = inject(WritingTaskService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  @ViewChildren('highlightRef', { read: ElementRef }) highlightElements!: QueryList<ElementRef<HTMLElement>>;
  @ViewChildren('correctionCard', { read: ElementRef }) correctionCardElements!: QueryList<ElementRef<HTMLElement>>;

  private highlightElementMap = new Map<string, HTMLElement>();
  private correctionElementMap = new Map<string, HTMLElement>();

  historyItem = signal<WritingHistoryDto | null>(null);
  originalTask = signal<WritingTask | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  activeInfoTab = signal<'question' | 'guide'>('question');
  activeCorrectionId = signal<string | null>(null);
  overlappingCorrections = signal<{ corrections: NormalizedCorrection[]; clickX: number; clickY: number } | null>(null);

  aiCorrections = computed<NormalizedCorrection[]>(() => {
    const source = this.historyItem()?.aiCorrections ?? [];
    return this.normalizeCorrections(source);
  });

  annotatedContent = computed<AnnotatedContent>(() => {
    const answer = this.historyItem()?.answer ?? '';
    return this.buildAnnotatedContent(
      answer,
      this.aiCorrections(),
      correction => correction.originalText,
      true
    );
  });

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const historyId = Number(params['id']);
      if (historyId) {
        this.loadHistoryItem(historyId);
      }
    });
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.rebuildHighlightMap();
      this.rebuildCorrectionMap();
    });

    this.highlightElements.changes.subscribe(() => this.rebuildHighlightMap());
    this.correctionCardElements.changes.subscribe(() => this.rebuildCorrectionMap());

    // Close menu when clicking outside
    document.addEventListener('click', (event) => {
      const menu = document.querySelector('.correction-selection-menu');
      if (menu && !menu.contains(event.target as Node)) {
        this.overlappingCorrections.set(null);
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

  hasCorrectedEssay(): boolean {
    const corrected = this.historyItem()?.aiCorrectedAnswer;
    return !!(corrected && corrected.trim().length);
  }

  getCorrectedEssay(): string | null {
    const corrected = this.historyItem()?.aiCorrectedAnswer;
    return corrected && corrected.trim().length ? corrected : null;
  }

  focusCorrection(correctionId: string | null): void {
    if (!correctionId) {
      this.activeCorrectionId.set(null);
      return;
    }
    this.activeCorrectionId.set(correctionId);
  }

  clearCorrectionFocus(): void {
    this.activeCorrectionId.set(null);
  }

  toggleCorrectionFocus(correctionId: string): void {
    if (this.activeCorrectionId() === correctionId) {
      this.activeCorrectionId.set(null);
    } else {
      this.focusCorrection(correctionId);
    }
  }

  onHighlightClick(correctionId: string, event?: MouseEvent): void {
    // Find the clicked correction
    const clickedCorrection = this.aiCorrections().find(c => c.id === correctionId);
    if (!clickedCorrection?.originalText) {
      // If no correction found, proceed with normal flow
      this.selectCorrection(correctionId);
      return;
    }

    const clickedText = clickedCorrection.originalText;
    const essayText = this.historyItem()?.answer || '';

    // Find all corrections that overlap with the clicked text
    // A correction overlaps if:
    // 1. Its originalText contains the clicked text, OR
    // 2. The clicked text contains its originalText
    const overlapping = this.aiCorrections().filter(correction => {
      if (correction.id === correctionId) return true; // Always include the clicked one
      if (!correction.originalText) return false;

      const otherText = correction.originalText;
      const clickedLower = clickedText.toLowerCase();
      const otherLower = otherText.toLowerCase();

      // Check if texts overlap (one contains the other)
      return clickedLower.includes(otherLower) || otherLower.includes(clickedLower);
    });

    // If there are multiple overlapping corrections, show selection menu
    if (overlapping.length > 1 && event) {
      // Adjust position to ensure menu stays within viewport
      const menuWidth = 500; // max-width of menu
      const menuHeight = 400; // estimated max height
      let x = event.clientX;
      let y = event.clientY;
      
      // Adjust X if menu would overflow right
      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 20;
      }
      // Adjust X if menu would overflow left
      if (x < 20) {
        x = 20;
      }
      
      // Adjust Y if menu would overflow bottom
      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 20;
      }
      // Adjust Y if menu would overflow top
      if (y < 20) {
        y = 20;
      }

      this.overlappingCorrections.set({
        corrections: overlapping,
        clickX: x,
        clickY: y
      });
      
      // Prevent event propagation to avoid closing menu immediately
      if (event) {
        event.stopPropagation();
      }
      return;
    }

    // If only one correction, proceed normally
    this.selectCorrection(correctionId);
  }

  selectCorrection(correctionId: string): void {
    this.activeCorrectionId.set(correctionId);
    this.overlappingCorrections.set(null);
    
    // Scroll to the corrections panel first, then to the specific correction card
    this.scrollToCorrectionsPanel();
    
    // Small delay to ensure panel is visible before scrolling to card
    setTimeout(() => {
      this.scrollToSuggestion(correctionId);
    }, 300);
  }

  selectCorrectionFromMenu(correctionId: string): void {
    this.overlappingCorrections.set(null);
    this.selectCorrection(correctionId);
  }

  isCorrectionHighlightable(correctionId: string): boolean {
    return this.annotatedContent().resolvedCorrectionIds.includes(correctionId);
  }

  mapIssueType(issueType?: string): string {
    if (!issueType) {
      return 'Khác';
    }
    const normalized = issueType.toLowerCase();
    const mapping: Record<string, string> = {
      grammar: 'Ngữ pháp',
      grammatical: 'Ngữ pháp',
      lexical: 'Từ vựng',
      vocabulary: 'Từ vựng',
      coherence: 'Coherence & Cohesion',
      cohesion: 'Coherence & Cohesion',
      task: 'Task Response',
      content: 'Task Response',
      addition: 'Bổ sung ý',
      expand: 'Bổ sung ý',
      extension: 'Bổ sung ý',
      other: 'Khác'
    };
    return mapping[normalized] || issueType;
  }

  mapSeverity(severity?: string | null): string {
    if (!severity) {
      return 'Trung bình';
    }
    const normalized = severity.toLowerCase();
    if (normalized === 'high') return 'Nghiêm trọng';
    if (normalized === 'medium') return 'Trung bình';
    if (normalized === 'low') return 'Nhẹ';
    return severity;
  }

  getHighlightClasses(correction: NormalizedCorrection): Record<string, boolean> {
    const base = {
      'ai-highlight': true,
      'highlight-grammar': false,
      'highlight-style': false,
      'highlight-addition': false
    };

    const key = this.getIssueTypeKey(correction.issueType);
    if (key === 'grammar') {
      base['highlight-grammar'] = true;
    } else if (key === 'addition') {
      base['highlight-addition'] = true;
    } else {
      base['highlight-style'] = true;
    }

    return base;
  }

  getCorrectionCardClasses(correction: NormalizedCorrection): Record<string, boolean> {
    const base = {
      'type-grammar': false,
      'type-style': false,
      'type-addition': false
    };

    const key = this.getIssueTypeKey(correction.issueType);
    if (key === 'grammar') {
      base['type-grammar'] = true;
    } else if (key === 'addition') {
      base['type-addition'] = true;
    } else {
      base['type-style'] = true;
    }

    return base;
  }

  trackSegment(index: number, segment: AnnotatedSegment): string {
    if (segment.kind === 'correction') {
      return `${segment.correction.id}-${index}`;
    }
    return `text-${index}`;
  }

  private normalizeCorrections(corrections: AiCorrection[]): NormalizedCorrection[] {
    return corrections.map((correction, index) => {
      const normalizedId = (correction.id && correction.id.trim().length ? correction.id : `C${index + 1}`).toString();
      const severity = correction.severity ? correction.severity.toLowerCase() : undefined;
      return {
        ...correction,
        id: normalizedId,
        severity: severity === 'high' || severity === 'medium' || severity === 'low' ? severity : correction.severity
      };
    });
  }

  private buildAnnotatedContent(
    baseText: string,
    corrections: NormalizedCorrection[],
    matchSource: (correction: NormalizedCorrection) => string | null | undefined,
    useIndexes: boolean
  ): AnnotatedContent {
    if (!baseText) {
      return {
        segments: [{ kind: 'text', text: '' }],
        resolvedCorrectionIds: [],
        unresolvedCorrectionIds: corrections.map(correction => correction.id),
        wordCount: 0
      };
    }

    if (!corrections.length) {
      return {
        segments: [{ kind: 'text', text: baseText }],
        resolvedCorrectionIds: [],
        unresolvedCorrectionIds: [],
        wordCount: this.countWords(baseText)
      };
    }

    const usedRanges: Array<{ start: number; end: number }> = [];
    const resolvedCorrections: Array<{ start: number; end: number; correction: NormalizedCorrection }> = [];
    const unresolved: string[] = [];

    corrections.forEach(correction => {
      const resolved = this.resolveCorrectionRange(baseText, correction, usedRanges, matchSource, useIndexes);
      if (resolved) {
        usedRanges.push({ start: resolved.start, end: resolved.end });
        resolvedCorrections.push(resolved);
      } else {
        unresolved.push(correction.id);
      }
    });

    if (!resolvedCorrections.length) {
      return {
        segments: [{ kind: 'text', text: baseText }],
        resolvedCorrectionIds: [],
        unresolvedCorrectionIds: unresolved,
        wordCount: this.countWords(baseText)
      };
    }

    resolvedCorrections.sort((a, b) => a.start - b.start);

    const segments: AnnotatedSegment[] = [];
    let cursor = 0;

    resolvedCorrections.forEach(item => {
      if (item.start > cursor) {
        segments.push({ kind: 'text', text: baseText.slice(cursor, item.start) });
      }
      segments.push({
        kind: 'correction',
        text: baseText.slice(item.start, item.end),
        correction: item.correction
      });
      cursor = item.end;
    });

    if (cursor < baseText.length) {
      segments.push({ kind: 'text', text: baseText.slice(cursor) });
    }

    return {
      segments,
      resolvedCorrectionIds: resolvedCorrections.map(item => item.correction.id),
      unresolvedCorrectionIds: unresolved,
      wordCount: this.countWords(baseText)
    };
  }

  private resolveCorrectionRange(
    targetText: string,
    correction: NormalizedCorrection,
    usedRanges: Array<{ start: number; end: number }>,
    matchSource: (correction: NormalizedCorrection) => string | null | undefined,
    useIndexes: boolean
  ): { start: number; end: number; correction: NormalizedCorrection } | null {
    // PRIORITY: Always use originalText to find and highlight, not indices
    // This ensures accuracy even if AI returns wrong indices
    const matchText = matchSource(correction);
    if (matchText) {
      // First, try exact match
      const occurrences = this.findOccurrences(targetText, matchText);
      for (const occurrence of occurrences) {
        const start = occurrence;
        const end = occurrence + matchText.length;
        if (!this.isOverlapping(start, end, usedRanges)) {
          return { start, end, correction };
        }
      }

      // If exact match not found, try trimmed version (without leading/trailing spaces)
      const trimmed = matchText.trim();
      if (trimmed && trimmed !== matchText) {
        const trimmedOccurrences = this.findOccurrences(targetText, trimmed);
        for (const occurrence of trimmedOccurrences) {
          const start = occurrence;
          const end = occurrence + trimmed.length;
          if (!this.isOverlapping(start, end, usedRanges)) {
            return { start, end, correction };
          }
        }
      }
    }

    // Fallback: Only use indices if originalText is not found (should rarely happen)
    if (useIndexes && !matchText) {
      const direct = this.validateRange(targetText, correction.startIndex, correction.endIndex);
      if (direct && !this.isOverlapping(direct.start, direct.end, usedRanges)) {
        console.warn(`Correction ${correction.id}: Using indices as fallback since originalText not found.`);
        return { ...direct, correction };
      }
    }

    return null;
  }

  private validateRange(answer: string, start?: number | null, end?: number | null): { start: number; end: number } | null {
    if (typeof start !== 'number' || typeof end !== 'number') {
      return null;
    }
    const normalizedStart = Math.max(0, Math.min(answer.length, start));
    const normalizedEnd = Math.max(normalizedStart, Math.min(answer.length, end));
    if (normalizedEnd <= normalizedStart) {
      return null;
    }
    return { start: normalizedStart, end: normalizedEnd };
  }

  private isOverlapping(start: number, end: number, ranges: Array<{ start: number; end: number }>): boolean {
    return ranges.some(range => this.rangesOverlap(range.start, range.end, start, end));
  }

  private rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
    return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
  }

  private findOccurrences(text: string, fragment: string): number[] {
    if (!fragment) {
      return [];
    }
    const occurrences: number[] = [];
    let searchIndex = 0;

    while (searchIndex < text.length) {
      const foundIndex = text.indexOf(fragment, searchIndex);
      if (foundIndex === -1) {
        break;
      }
      occurrences.push(foundIndex);
      searchIndex = foundIndex + Math.max(1, fragment.length);
    }

    if (!occurrences.length) {
      const lowerText = text.toLowerCase();
      const lowerFragment = fragment.toLowerCase();
      searchIndex = 0;
      while (searchIndex < lowerText.length) {
        const foundIndex = lowerText.indexOf(lowerFragment, searchIndex);
        if (foundIndex === -1) {
          break;
        }
        occurrences.push(foundIndex);
        searchIndex = foundIndex + Math.max(1, lowerFragment.length);
      }
    }

    return occurrences;
  }

  scrollToHighlight(correctionId: string): void {
    // Set active correction first
    this.activeCorrectionId.set(correctionId);

    // Try to find existing highlight element
    let target = this.findHighlightElement(correctionId);
    
    // If not found, try to find originalText in the essay text spans
    if (!target) {
      const correction = this.aiCorrections().find(c => c.id === correctionId);
      
      if (correction?.originalText) {
        const originalText = correction.originalText;
        const essayContentElement = document.querySelector('.essay-content');
        
        if (essayContentElement) {
          // Find all text spans in the essay
          const textSpans = Array.from(essayContentElement.querySelectorAll('.essay-text')) as HTMLElement[];
          
          // Try to find the span containing the originalText
          for (const span of textSpans) {
            const spanText = span.textContent || '';
            
            // Check if originalText exists in this span (exact, case-insensitive, or trimmed)
            if (spanText.includes(originalText) || 
                spanText.toLowerCase().includes(originalText.toLowerCase()) ||
                spanText.includes(originalText.trim()) ||
                spanText.toLowerCase().includes(originalText.trim().toLowerCase())) {
              
              // Found the span containing the text - use it as target
              target = span;
              break;
            }
          }
        }
      }
      
      // If still not found, retry after a short delay
      if (!target) {
        setTimeout(() => this.scrollToHighlight(correctionId), 100);
        return;
      }
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      // Calculate the position relative to the document
      const rect = target.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const targetTop = rect.top + scrollTop;
      
      // Scroll window to the target position, centered in viewport
      const viewportHeight = window.innerHeight;
      const targetScrollPosition = Math.max(0, targetTop - (viewportHeight / 2) + (rect.height / 2));
      
      // Use scrollIntoView as fallback, but also scroll window
      target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
      
      // Also scroll window to ensure it works even if element is in scrollable container
      window.scrollTo({
        top: targetScrollPosition,
        behavior: 'smooth'
      });

      // Add highlight animation class
      target.classList.add('highlight-pulse');
      
      // Remove highlight class after 1.5 seconds
      setTimeout(() => {
        target.classList.remove('highlight-pulse');
      }, 1500);

      // Ensure element is visible and readable by adding a slight delay for scroll to complete
      setTimeout(() => {
        // Recalculate position after scroll
        const newRect = target.getBoundingClientRect();
        const newScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const newTargetTop = newRect.top + newScrollTop;
        const newTargetScrollPosition = Math.max(0, newTargetTop - (viewportHeight / 2) + (newRect.height / 2));
        
        // Use both methods to ensure scrolling works
        target.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
        window.scrollTo({
          top: newTargetScrollPosition,
          behavior: 'smooth'
        });
      }, 300);
    });
  }

  scrollToSuggestion(correctionId: string): void {
    const card = this.findCorrectionCard(correctionId);
    if (!card) {
      setTimeout(() => this.scrollToSuggestion(correctionId), 100);
      return;
    }
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  scrollToCorrectionsPanel(): void {
    const panel = document.querySelector('.corrections-panel-full') || document.querySelector('.corrections-panel');
    if (panel) {
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private findHighlightElement(correctionId: string): HTMLElement | null {
    return this.highlightElementMap.get(correctionId) ?? null;
  }

  private findCorrectionCard(correctionId: string): HTMLElement | null {
    return this.correctionElementMap.get(correctionId) ?? null;
  }

  private rebuildHighlightMap(): void {
    this.highlightElementMap.clear();
    this.highlightElements.forEach(element => {
      const id = element.nativeElement.dataset['correctionId'];
      if (id) {
        this.highlightElementMap.set(id, element.nativeElement);
      }
    });
  }

  private rebuildCorrectionMap(): void {
    this.correctionElementMap.clear();
    this.correctionCardElements.forEach(element => {
      const id = element.nativeElement.dataset['correctionId'];
      if (id) {
        this.correctionElementMap.set(id, element.nativeElement);
      }
    });
  }

  private getIssueTypeKey(issueType?: string | null): 'grammar' | 'style' | 'addition' | 'other' {
    if (!issueType) {
      return 'other';
    }
    const normalized = issueType.trim().toLowerCase();
    if (['grammar', 'grammatical', 'syntax'].includes(normalized)) {
      return 'grammar';
    }
    if (['addition', 'expand', 'extension', 'add', 'supporting'].includes(normalized)) {
      return 'addition';
    }
    if (['lexical', 'vocabulary', 'style', 'coherence', 'cohesion', 'clarity', 'fluency', 'improvement', 'tone'].includes(normalized)) {
      return 'style';
    }
    return 'other';
  }

  private countWords(text: string): number {
    const trimmed = text.trim();
    if (!trimmed) {
      return 0;
    }
    return trimmed.split(/\s+/).filter(Boolean).length;
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
