import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { WritingTaskService } from '../../services/writing-task.service';
import { WritingHistoryService } from '../../services/writing-history.service';
import { WritingTask, WritingTask1, WritingTask2 } from '../../models/writing-task.model';
import { WritingHistoryDto } from '../../services/writing-history-api.service';
import { AppConfig } from '../../config/app.config';
import { Subject, takeUntil, firstValueFrom, filter, timeout, catchError, of } from 'rxjs';

interface MockTestResult {
  task1Result?: WritingHistoryDto;
  task2Result?: WritingHistoryDto;
  totalScore?: number;
  averageScore?: number;
}

@Component({
  selector: 'app-writing-mock-test',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mock-test-container">
      <!-- Mock Test Banner -->
      <div class="mock-test-banner">
        <div class="banner-content">
          <div class="banner-icon">🎯</div>
          <div class="banner-text">
            <strong>Mock Test - Thi thử nghiêm ngặt</strong>
            <span>Timer nghiêm ngặt • Không có gợi ý • Tự động submit khi hết giờ</span>
          </div>
          <div class="timer-display">
            <div class="timer-label">Thời gian còn lại:</div>
            <div class="timer-value" [class.warning]="timeLeft() < 600" [class.danger]="timeLeft() < 300">
              {{ formatTime(timeLeft()) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="loading-state">
        <div class="spinner"></div>
        <p>Đang tải bài thi...</p>
      </div>

      <!-- Test Interface -->
      <div *ngIf="!loading() && task1() && task2() && !testCompleted()" class="test-interface">
        <!-- Task Tabs -->
        <div class="task-tabs">
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'task1'"
            [class.empty-answer]="!task1Answer.trim()"
            (click)="setActiveTab('task1')">
            📝 Task 1 ({{ getWordCount('task1') }} từ)
            <span *ngIf="!task1Answer.trim()" class="empty-warning">⚠️ Chưa trả lời</span>
          </button>
          <button 
            class="tab-btn" 
            [class.active]="activeTab() === 'task2'"
            [class.empty-answer]="!task2Answer.trim()"
            (click)="setActiveTab('task2')">
            ✍️ Task 2 ({{ getWordCount('task2') }} từ)
            <span *ngIf="!task2Answer.trim()" class="empty-warning">⚠️ Chưa trả lời</span>
          </button>
        </div>

        <!-- Task 1 Content -->
        <div *ngIf="activeTab() === 'task1'" class="task-content-wrapper">
          <!-- Left Column: Question Panel -->
          <div class="left-column">
            <div class="question-panel">
              <div class="task-header">
                <h3>{{ task1()!.title }}</h3>
                <div class="task-info">
                  <span>⏱️ {{ task1()!.timeLimit }} phút</span>
                  <span>📝 {{ task1()!.wordCount }} từ</span>
                </div>
              </div>

              <div class="task-instruction" *ngIf="task1()!.instruction">
                <div class="section-label">Đề bài:</div>
                <div class="instruction-content">{{ task1()!.instruction }}</div>
              </div>

              <div *ngIf="task1()!.type === 'task1'" class="task1-specific">
                <div *ngIf="getTask1ImageUrl()" class="task-image">
                  <div class="section-label">Hình minh họa:</div>
                  <img [src]="getTask1ImageUrl()" alt="Task 1 Chart/Graph">
                </div>
                <div *ngIf="getTask1Description()" class="task-description">
                  <div class="section-label">Mô tả:</div>
                  <div class="section-content" [innerHTML]="sanitizeHtml(getTask1Description())"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Writing Area -->
          <div class="writing-area">
            <div class="writing-textarea-container">
              <textarea
                [(ngModel)]="task1Answer"
                placeholder="Viết bài Task 1 của bạn ở đây..."
                class="writing-textarea"></textarea>
            </div>
            <div class="word-count-bar">
              <span [class.warning]="getWordCount('task1') < task1()!.wordCount * 0.9">
                {{ getWordCount('task1') }} / {{ task1()!.wordCount }} từ
              </span>
            </div>
          </div>
        </div>

        <!-- Task 2 Content -->
        <div *ngIf="activeTab() === 'task2'" class="task-content-wrapper">
          <!-- Left Column: Question Panel -->
          <div class="left-column">
            <div class="question-panel">
              <div class="task-header">
                <h3>{{ task2()!.title }}</h3>
                <div class="task-info">
                  <span>⏱️ {{ task2()!.timeLimit }} phút</span>
                  <span>📝 {{ task2()!.wordCount }} từ</span>
                </div>
              </div>

              <div class="task-instruction" *ngIf="task2()!.instruction">
                <div class="section-label">Đề bài:</div>
                <div class="instruction-content">{{ task2()!.instruction }}</div>
              </div>

              <div *ngIf="task2()!.type === 'task2'" class="task2-specific">
                <div class="task-question" *ngIf="getTask2Question()">
                  <div class="section-label">Câu hỏi chính:</div>
                  <div class="section-content" [innerHTML]="sanitizeHtml(getTask2Question())"></div>
                </div>
                <div *ngIf="getTask2AdditionalQuestions()?.length" class="additional-questions">
                  <div class="section-label">Câu hỏi bổ sung:</div>
                  <ul>
                    <li *ngFor="let question of getTask2AdditionalQuestions()">{{ question }}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: Writing Area -->
          <div class="writing-area">
            <div class="writing-textarea-container">
              <textarea
                [(ngModel)]="task2Answer"
                placeholder="Viết bài Task 2 của bạn ở đây..."
                class="writing-textarea"></textarea>
            </div>
            <div class="word-count-bar">
              <span [class.warning]="getWordCount('task2') < task2()!.wordCount * 0.9">
                {{ getWordCount('task2') }} / {{ task2()!.wordCount }} từ
              </span>
            </div>
          </div>
        </div>

        <!-- Submit Button -->
        <div class="submit-section">
          <button 
            class="btn btn-submit" 
            (click)="submitMockTest()"
            [disabled]="submitting()">
            {{ submitting() ? 'Đang nộp bài...' : 'Nộp bài thi' }}
          </button>
        </div>
      </div>

      <!-- Results View -->
      <div *ngIf="testCompleted() && mockTestResult()" class="results-view">
        <div class="results-header">
          <h2>🎉 Kết quả Mock Test</h2>
          <p>Bạn đã hoàn thành bài thi!</p>
          <div *ngIf="waitingForAiScoring()" class="ai-scoring-indicator">
            <div class="spinner-small"></div>
            <span>Đang chờ AI chấm điểm... Vui lòng đợi trong giây lát.</span>
          </div>
        </div>

        <div class="results-summary">
          <div class="summary-card">
            <div class="summary-label">Tổng điểm</div>
            <div class="summary-value">{{ mockTestResult()!.averageScore?.toFixed(1) || 'N/A' }} / 9.0</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Task 1</div>
            <div class="summary-value">{{ mockTestResult()!.task1Result?.aiScore?.toFixed(1) || 'N/A' }} / 9.0</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">Task 2</div>
            <div class="summary-value">{{ mockTestResult()!.task2Result?.aiScore?.toFixed(1) || 'N/A' }} / 9.0</div>
          </div>
        </div>

        <div class="results-details">
          <div class="result-card" *ngIf="mockTestResult()!.task1Result">
            <div class="result-card-header">
              <h3>📝 Task 1 - Chi tiết</h3>
              <button class="btn btn-detail" (click)="viewTaskDetail(mockTestResult()!.task1Result!.id)">
                Xem chi tiết →
              </button>
            </div>
            <div class="score-breakdown">
              <div class="score-item">
                <span>Task Achievement:</span>
                <strong>{{ mockTestResult()!.task1Result!.taskAchievement?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Coherence & Cohesion:</span>
                <strong>{{ mockTestResult()!.task1Result!.coherenceCohesion?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Lexical Resource:</span>
                <strong>{{ mockTestResult()!.task1Result!.lexicalResource?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Grammatical Range:</span>
                <strong>{{ mockTestResult()!.task1Result!.grammaticalRange?.toFixed(1) || 'N/A' }}</strong>
              </div>
            </div>
            <div *ngIf="mockTestResult()!.task1Result!.aiFeedback" class="feedback-section">
              <h4>Nhận xét:</h4>
              <p [innerHTML]="sanitizeHtml(mockTestResult()!.task1Result!.aiFeedback)"></p>
            </div>
          </div>

          <div class="result-card" *ngIf="mockTestResult()!.task2Result">
            <div class="result-card-header">
              <h3>✍️ Task 2 - Chi tiết</h3>
              <button class="btn btn-detail" (click)="viewTaskDetail(mockTestResult()!.task2Result!.id)">
                Xem chi tiết →
              </button>
            </div>
            <div class="score-breakdown">
              <div class="score-item">
                <span>Task Achievement:</span>
                <strong>{{ mockTestResult()!.task2Result!.taskAchievement?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Coherence & Cohesion:</span>
                <strong>{{ mockTestResult()!.task2Result!.coherenceCohesion?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Lexical Resource:</span>
                <strong>{{ mockTestResult()!.task2Result!.lexicalResource?.toFixed(1) || 'N/A' }}</strong>
              </div>
              <div class="score-item">
                <span>Grammatical Range:</span>
                <strong>{{ mockTestResult()!.task2Result!.grammaticalRange?.toFixed(1) || 'N/A' }}</strong>
              </div>
            </div>
            <div *ngIf="mockTestResult()!.task2Result!.aiFeedback" class="feedback-section">
              <h4>Nhận xét:</h4>
              <p [innerHTML]="sanitizeHtml(mockTestResult()!.task2Result!.aiFeedback)"></p>
            </div>
          </div>
        </div>

        <div class="results-actions">
          <button class="btn btn-primary" (click)="goToMockTestHistory()">Xem lịch sử Mock Test</button>
          <button class="btn btn-secondary" (click)="goToWritingHistory()">Xem lịch sử chấm bài</button>
          <button class="btn btn-secondary" (click)="startNewMockTest()">Làm lại Mock Test</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mock-test-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
      min-height: calc(100vh - 70px);
    }

    /* Mock Test Banner */
    .mock-test-banner {
      background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
      color: white;
      padding: 0.75rem 1.5rem;
      box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
      margin-bottom: 1rem;
      border-radius: 6px;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .banner-icon {
      font-size: 1.5rem;
    }

    .banner-text {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .banner-text strong {
      font-size: 1rem;
      font-weight: 700;
    }

    .banner-text span {
      font-size: 0.85rem;
      opacity: 0.95;
    }

    .timer-display {
      text-align: right;
      padding: 0.5rem 1rem;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 6px;
      min-width: 160px;
    }

    .timer-label {
      font-size: 0.75rem;
      opacity: 0.9;
      margin-bottom: 0.15rem;
    }

    .timer-value {
      font-size: 1.4rem;
      font-weight: 700;
      font-family: 'Courier New', monospace;
    }

    .timer-value.warning {
      color: #ffd700;
    }

    .timer-value.danger {
      color: #ff4444;
      animation: pulse 1s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }

    /* Loading State */
    .loading-state {
      text-align: center;
      padding: 4rem 2rem;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Test Interface - chiều cao lớn hơn để vùng làm bài đủ dài, giảm scroll khi viết bài dài */
    .test-interface {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: calc(100vh - 90px);
      min-height: 720px;
    }

    .task-tabs {
      display: flex;
      background: #f8f9fa;
      border-bottom: 2px solid #dee2e6;
    }

    .tab-btn {
      flex: 1;
      padding: 1rem 2rem;
      background: transparent;
      border: none;
      border-bottom: 3px solid transparent;
      cursor: pointer;
      font-size: 1.1rem;
      font-weight: 600;
      color: #666;
      transition: all 0.3s;
    }

    .tab-btn:hover {
      background: #e9ecef;
      color: #333;
    }

    .tab-btn.active {
      color: #667eea;
      border-bottom-color: #667eea;
      background: white;
    }

    .tab-btn.empty-answer {
      background: #fff3cd;
      border-left: 3px solid #ffc107;
    }

    .tab-btn.empty-answer:hover {
      background: #ffe69c;
    }

    .tab-btn.empty-answer.active {
      background: #fff3cd;
      border-bottom-color: #ffc107;
    }

    .empty-warning {
      display: inline-block;
      margin-left: 0.5rem;
      font-size: 0.85rem;
      color: #856404;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
      background: rgba(255, 193, 7, 0.2);
      border-radius: 4px;
    }

    /* Task Content Wrapper - 2 Column Layout */
    .task-content-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
      min-height: 0;
    }

    /* Left Column: Question Panel - Fixed on left */
    .left-column {
      width: 480px;
      height: 100%;
      background: #f8f9fa;
      border-right: 1px solid #e5e7eb;
      overflow-y: auto;
      overflow-x: hidden;
      flex-shrink: 0;
      position: relative;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
      scrollbar-color: #cbd5e1 #f1f5f9;
    }

    .left-column::-webkit-scrollbar {
      width: 6px;
    }

    .left-column::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    .left-column::-webkit-scrollbar-thumb {
      background: #cbd5e1;
      border-radius: 3px;
    }

    .left-column::-webkit-scrollbar-thumb:hover {
      background: #94a3b8;
    }

    .question-panel {
      padding: 1.5rem;
      min-height: 100%;
    }

    .task-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #e5e7eb;
    }

    .task-header h3 {
      margin: 0 0 0.75rem 0;
      color: #1f2937;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .task-info {
      display: flex;
      gap: 1.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .section-label {
      font-size: 0.8125rem;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 0.75rem;
      margin-top: 1.25rem;
    }

    .task-instruction {
      margin-bottom: 1.5rem;
    }

    .instruction-content {
      color: #374151;
      font-size: 0.9375rem;
      line-height: 1.7;
      white-space: pre-line;
    }

    .task-image {
      margin: 1.5rem 0;
      padding: 0.75rem;
      background: white;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .task-image img {
      width: 100%;
      max-width: 100%;
      height: auto;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: block;
    }

    .task-description {
      margin: 1.5rem 0;
    }

    .section-content {
      color: #1f2937;
      font-size: 0.9375rem;
      line-height: 1.7;
    }

    .task-question {
      margin: 1.5rem 0;
    }

    .additional-questions {
      margin: 1.5rem 0;
      padding: 0.75rem;
      background: #fef3c7;
      border-radius: 6px;
      border-left: 3px solid #fbbf24;
    }

    .additional-questions ul {
      margin: 0.5rem 0 0 0;
      padding-left: 1.25rem;
      font-size: 0.875rem;
      line-height: 1.5;
    }

    .additional-questions li {
      margin-bottom: 0.375rem;
      color: #374151;
    }

    /* Right Column: Writing Area - đủ cao để viết bài dài, ít phải scroll */
    .writing-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      min-height: 520px;
      background: white;
      overflow: hidden;
    }

    .writing-textarea-container {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      min-height: 480px;
    }

    .writing-textarea {
      width: 100%;
      height: 100%;
      min-height: 460px;
      padding: 2rem;
      border: none;
      font-size: 1.0625rem;
      line-height: 1.8;
      resize: none;
      font-family: 'Times New Roman', serif;
      outline: none;
      background: white;
      box-sizing: border-box;
    }

    .writing-textarea::selection {
      background: rgba(251, 191, 36, 0.4);
    }

    .word-count-bar {
      padding: 0.75rem 1.5rem;
      background: #f8fafc;
      border-top: 1px solid #e5e7eb;
      text-align: right;
      color: #6b7280;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .word-count-bar .warning {
      color: #dc2626;
      font-weight: 600;
    }

    .submit-section {
      padding: 1.5rem 2rem;
      background: #f8f9fa;
      border-top: 1px solid #dee2e6;
      text-align: center;
      flex-shrink: 0;
      z-index: 10;
    }

    .btn {
      padding: 1rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-submit {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-submit:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    .btn-submit:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    /* Results View */
    .results-view {
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
      padding: 2rem;
    }

    .results-header {
      text-align: center;
      margin-bottom: 2rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid #e9ecef;
    }

    .results-header h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 2rem;
    }

    .ai-scoring-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      margin-top: 1rem;
      padding: 0.75rem 1.5rem;
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      color: #856404;
      font-size: 0.9rem;
    }

    .spinner-small {
      border: 2px solid #f3f3f3;
      border-top: 2px solid #ffc107;
      border-radius: 50%;
      width: 20px;
      height: 20px;
      animation: spin 1s linear infinite;
    }

    .results-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .summary-card {
      text-align: center;
      padding: 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
    }

    .summary-label {
      font-size: 0.9rem;
      opacity: 0.9;
      margin-bottom: 0.5rem;
    }

    .summary-value {
      font-size: 2.5rem;
      font-weight: 700;
    }

    .results-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 2rem;
      margin-bottom: 2rem;
    }

    .result-card {
      padding: 1.5rem;
      background: #f8f9fa;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }

    .result-card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
      gap: 1rem;
    }

    .result-card h3 {
      margin: 0;
      color: #2c3e50;
      flex: 1;
    }

    .btn-detail {
      padding: 0.5rem 1.25rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      white-space: nowrap;
    }

    .btn-detail:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .score-breakdown {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.5rem;
    }

    .score-item {
      display: flex;
      justify-content: space-between;
      padding: 0.75rem;
      background: white;
      border-radius: 6px;
    }

    .score-item strong {
      color: #667eea;
      font-size: 1.1rem;
    }

    .feedback-section {
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid #dee2e6;
    }

    .feedback-section h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
    }

    .feedback-section p {
      margin: 0;
      line-height: 1.6;
      color: #555;
    }

    .results-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      padding-top: 2rem;
      border-top: 2px solid #e9ecef;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #5a6268;
    }

    @media (max-width: 1024px) {
      .left-column {
        width: 400px;
      }
    }

    @media (max-width: 768px) {
      .mock-test-container {
        padding: 1rem;
      }

      .banner-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .timer-display {
        min-width: auto;
        width: 100%;
      }

      .results-summary,
      .results-details {
        grid-template-columns: 1fr;
      }

      .result-card-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.75rem;
      }

      .btn-detail {
        width: 100%;
        padding: 0.75rem 1.25rem;
      }

      .task-tabs {
        flex-direction: column;
      }

      .tab-btn {
        border-bottom: 1px solid #dee2e6;
        border-right: none;
      }

      .tab-btn.active {
        border-bottom-color: #667eea;
        border-left: 3px solid #667eea;
      }

      /* Mobile: Stack layout */
      .task-content-wrapper {
        flex-direction: column;
        height: auto;
        max-height: calc(100vh - 200px);
      }

      .left-column {
        width: 100%;
        height: 40vh;
        max-height: 400px;
        border-right: none;
        border-bottom: 1px solid #e5e7eb;
      }

      .writing-area {
        height: auto;
        min-height: 420px;
      }
    }
  `]
})
export class WritingMockTestComponent implements OnInit, OnDestroy {
  private writingService = inject(WritingTaskService);
  private historyService = inject(WritingHistoryService);
  private router = inject(Router);
  private http = inject(HttpClient);
  private sanitizer = inject(DomSanitizer);
  private readonly apiUrl = `${AppConfig.api.baseUrl}/api/writing-history`;
  private destroy$ = new Subject<void>();
  private timerInterval: any = null;

  // Signals
  loading = signal(true);
  task1 = signal<WritingTask1 | null>(null);
  task2 = signal<WritingTask2 | null>(null);
  activeTab = signal<'task1' | 'task2'>('task1');
  timeLeft = signal(3600); // 60 minutes in seconds
  testCompleted = signal(false);
  submitting = signal(false);
  waitingForAiScoring = signal(false);
  mockTestResult = signal<MockTestResult | null>(null);

  // Answers
  task1Answer = '';
  task2Answer = '';
  startTime = Date.now();

  ngOnInit() {
    // Check URL params to see if user wants to start a new test
    const urlParams = new URLSearchParams(window.location.search);
    const startNew = urlParams.get('new') === 'true';
    
    // Check if user is coming back from detail page (via sessionStorage flag)
    const comingFromDetail = sessionStorage.getItem('coming_back_from_mock_test_detail') === 'true';
    
    if (startNew || !comingFromDetail) {
      // User wants a new test or navigated directly - clear old state
      sessionStorage.removeItem('mock_test_result_state');
      sessionStorage.removeItem('coming_back_from_mock_test_detail');
      this.loadMockTestTasks();
      this.startTimer();
      return;
    }
    
    // Only restore state if user is coming back from detail page
    if (comingFromDetail) {
      const stateRestored = this.restoreStateFromSession();
      if (stateRestored) {
        // Clear the flag after restoring
        sessionStorage.removeItem('coming_back_from_mock_test_detail');
        return;
      }
    }
    
    // Fallback: load new tasks if restore failed
    this.loadMockTestTasks();
    this.startTimer();
  }
  
  private restoreStateFromSession() {
    try {
      const savedState = sessionStorage.getItem('mock_test_result_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        if (state.mockTestResult) {
          this.mockTestResult.set(state.mockTestResult);
          this.testCompleted.set(true);
          this.submitting.set(false);
          this.waitingForAiScoring.set(false);
          this.loading.set(false); // Important: set loading to false when restoring state
          console.log('✅ Restored mock test result state from sessionStorage');
          return true; // Return true if state was restored
        }
      }
    } catch (error) {
      console.error('Error restoring state:', error);
    }
    return false; // Return false if no state was restored
  }
  
  private saveStateToSession() {
    try {
      const state = {
        mockTestResult: this.mockTestResult(),
        testCompleted: this.testCompleted()
      };
      sessionStorage.setItem('mock_test_result_state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving state:', error);
    }
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadMockTestTasks() {
    this.loading.set(true);
    
    try {
      // Ensure tasks are loaded first
      this.writingService.loadTasks();
      
      // Wait a bit for the API call to start
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Get tasks with timeout - wait for loading to complete or timeout after 10 seconds
      const tasks = await firstValueFrom(
        this.writingService.tasks$.pipe(
          timeout(10000), // 10 second timeout
          catchError(err => {
            console.warn('⚠️ Timeout or error waiting for tasks, trying direct access:', err);
            return of([]); // Return empty array on timeout
          })
        )
      );
      
      console.log('📚 Loaded tasks for mock test:', tasks.length);
      
      // If no tasks, try to get from service directly (might be cached)
      let finalTasks = tasks;
      if (tasks.length === 0) {
        try {
          finalTasks = await firstValueFrom(this.writingService.getTasks());
          console.log('📚 Got tasks from direct service call:', finalTasks.length);
        } catch (err) {
          console.error('❌ Could not get tasks:', err);
        }
      }
      
      // Filter active tasks
      const activeTasks = finalTasks.filter(t => t.isActive);
      console.log('✅ Active tasks:', activeTasks.length);
      console.log('📋 All tasks (including inactive):', finalTasks.length);
      
      // Get random Task 1
      const task1List = activeTasks.filter(t => t.type === 'task1') as WritingTask1[];
      // Get random Task 2
      const task2List = activeTasks.filter(t => t.type === 'task2') as WritingTask2[];

      console.log('📝 Task 1 available:', task1List.length);
      console.log('📝 Task 2 available:', task2List.length);

      if (task1List.length === 0 || task2List.length === 0) {
        const message = task1List.length === 0 && task2List.length === 0
          ? 'Không tìm thấy bài tập nào trong hệ thống.\n\nVui lòng thêm bài tập vào hệ thống trước khi sử dụng Mock Test.\n\nBạn có thể thêm bài tập qua trang Quản lý bài tập (Admin).'
          : task1List.length === 0
          ? 'Không tìm thấy bài tập Task 1.\n\nVui lòng thêm ít nhất 1 bài Task 1 vào hệ thống.\n\nBạn có thể thêm bài tập qua trang Quản lý bài tập (Admin).'
          : 'Không tìm thấy bài tập Task 2.\n\nVui lòng thêm ít nhất 1 bài Task 2 vào hệ thống.\n\nBạn có thể thêm bài tập qua trang Quản lý bài tập (Admin).';
        
        alert(message);
        this.router.navigate(['/writing']);
        this.loading.set(false);
        return;
      }

      // Random selection
      const randomTask1 = task1List[Math.floor(Math.random() * task1List.length)];
      const randomTask2 = task2List[Math.floor(Math.random() * task2List.length)];

      console.log('🎲 Selected Task 1:', randomTask1.title);
      console.log('🎲 Selected Task 2:', randomTask2.title);

      this.task1.set(randomTask1);
      this.task2.set(randomTask2);

      // Calculate total time (Task 1: 20 min, Task 2: 40 min = 60 min total)
      const totalTime = (randomTask1.timeLimit + randomTask2.timeLimit) * 60;
      this.timeLeft.set(totalTime);
      this.startTime = Date.now();

      this.loading.set(false);
    } catch (error) {
      console.error('❌ Error loading mock test tasks:', error);
      console.error('Error details:', error);
      alert('Không thể tải bài tập. Vui lòng kiểm tra kết nối và thử lại.\n\nNếu vấn đề vẫn tiếp tục, hãy đảm bảo bạn đã thêm bài tập vào hệ thống.');
      this.router.navigate(['/writing']);
      this.loading.set(false);
    } finally {
      // Ensure loading is always set to false, even if there's an unexpected error
      this.loading.set(false);
    }
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      const newTime = this.timeLeft() - 1;
      if (newTime <= 0) {
        this.timeLeft.set(0);
        clearInterval(this.timerInterval);
        // Auto submit when time runs out
        this.autoSubmitMockTest();
      } else {
        this.timeLeft.set(newTime);
      }
    }, 1000);
  }

  setActiveTab(tab: 'task1' | 'task2') {
    this.activeTab.set(tab);
  }

  getWordCount(task: 'task1' | 'task2'): number {
    const answer = task === 'task1' ? this.task1Answer : this.task2Answer;
    if (!answer.trim()) return 0;
    return answer.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  getTask1ImageUrl(): string | null {
    const task = this.task1();
    if (task?.type === 'task1') {
      return task.imageUrl || null;
    }
    return null;
  }

  getTask1Description(): string | null {
    const task = this.task1();
    if (task?.type === 'task1') {
      return task.description || null;
    }
    return null;
  }

  getTask2Question(): string {
    const task = this.task2();
    if (task?.type === 'task2') {
      return task.question || '';
    }
    return '';
  }

  getTask2AdditionalQuestions(): string[] {
    const task = this.task2();
    if (task?.type === 'task2') {
      return task.additionalQuestions || [];
    }
    return [];
  }

  calculateTimeSpent(): number {
    return Math.floor((Date.now() - this.startTime) / 1000); // in seconds
  }

  submitMockTest() {
    // Check if any task has empty answer
    const task1Empty = !this.task1Answer.trim();
    const task2Empty = !this.task2Answer.trim();
    
    if (task1Empty || task2Empty) {
      let warningMessage = '⚠️ Cảnh báo: Bạn chưa hoàn thành một số bài tập:\n\n';
      
      if (task1Empty && task2Empty) {
        warningMessage += '❌ Task 1: Chưa có câu trả lời\n';
        warningMessage += '❌ Task 2: Chưa có câu trả lời\n\n';
        warningMessage += 'Bạn có muốn nộp bài thi với các bài tập chưa hoàn thành không?';
      } else if (task1Empty) {
        warningMessage += '❌ Task 1: Chưa có câu trả lời\n';
        warningMessage += '✅ Task 2: Đã có câu trả lời\n\n';
        warningMessage += 'Bạn có muốn nộp bài thi mà không trả lời Task 1 không?';
      } else {
        warningMessage += '✅ Task 1: Đã có câu trả lời\n';
        warningMessage += '❌ Task 2: Chưa có câu trả lời\n\n';
        warningMessage += 'Bạn có muốn nộp bài thi mà không trả lời Task 2 không?';
      }
      
      if (!confirm(warningMessage)) {
        // Switch to the empty task tab to help user
        if (task1Empty && !task2Empty) {
          this.setActiveTab('task1');
        } else if (task2Empty && !task1Empty) {
          this.setActiveTab('task2');
        } else if (task1Empty) {
          // If both empty, go to task1 first
          this.setActiveTab('task1');
        }
        return;
      }
    } else {
      // Both tasks have answers, show normal confirmation
      if (!confirm('Bạn có chắc chắn muốn nộp bài thi? Sau khi nộp, bạn sẽ không thể chỉnh sửa.')) {
        return;
      }
    }

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.submitting.set(true);
    this.submitBothTasks();
  }

  autoSubmitMockTest() {
    alert('⏰ Hết thời gian! Hệ thống sẽ tự động nộp bài thi của bạn.');
    this.submitting.set(true);
    this.submitBothTasks();
  }

  private submitBothTasks() {
    const task1 = this.task1();
    const task2 = this.task2();
    
    if (!task1 || !task2) {
      alert('Lỗi: Không tìm thấy bài tập.');
      this.submitting.set(false);
      return;
    }

    const totalTimeSpent = this.calculateTimeSpent();
    const task1TimeSpent = Math.floor(totalTimeSpent * (task1.timeLimit / (task1.timeLimit + task2.timeLimit)));
    const task2TimeSpent = totalTimeSpent - task1TimeSpent;

    // Submit Task 1
    // Ensure answer is not empty (backend validation requirement)
    const task1AnswerText = this.task1Answer.trim() || '[No answer provided - submitted automatically]';
    const task1Submit$ = this.historyService.submitWriting({
      taskId: Number(task1.id),
      answer: task1AnswerText,
      wordCount: this.getWordCount('task1'),
      timeSpent: task1TimeSpent
    });

    // Submit Task 2
    // Ensure answer is not empty (backend validation requirement)
    const task2AnswerText = this.task2Answer.trim() || '[No answer provided - submitted automatically]';
    const task2Submit$ = this.historyService.submitWriting({
      taskId: Number(task2.id),
      answer: task2AnswerText,
      wordCount: this.getWordCount('task2'),
      timeSpent: task2TimeSpent
    });

    // Wait for both submissions, then trigger AI scoring
    Promise.all([
      firstValueFrom(task1Submit$),
      firstValueFrom(task2Submit$)
    ]).then(([task1Result, task2Result]) => {
      console.log('✅ Both tasks submitted successfully');
      console.log('📝 Task 1 History ID:', task1Result.id);
      console.log('📝 Task 2 History ID:', task2Result.id);
      
      this.waitingForAiScoring.set(true);
      
      // Trigger AI scoring for both tasks
      console.log('🤖 Triggering AI scoring for both tasks...');
      
      const task1Scoring$ = this.historyService.scoreWritingAttempt({
        historyId: task1Result.id,
        taskId: Number(task1.id),
        answer: task1Result.answer || task1AnswerText,
        wordCount: task1Result.wordCount || this.getWordCount('task1'),
        timeSpent: task1Result.timeSpent || task1TimeSpent
      });
      
      const task2Scoring$ = this.historyService.scoreWritingAttempt({
        historyId: task2Result.id,
        taskId: Number(task2.id),
        answer: task2Result.answer || task2AnswerText,
        wordCount: task2Result.wordCount || this.getWordCount('task2'),
        timeSpent: task2Result.timeSpent || task2TimeSpent
      });
      
      // Start AI scoring (fire and forget - will be processed asynchronously)
      task1Scoring$.subscribe({
        next: (result) => {
          console.log('✅ Task 1 AI scoring triggered:', result.id);
        },
        error: (err) => {
          console.error('❌ Error triggering AI scoring for Task 1:', err);
        }
      });
      
      task2Scoring$.subscribe({
        next: (result) => {
          console.log('✅ Task 2 AI scoring triggered:', result.id);
        },
        error: (err) => {
          console.error('❌ Error triggering AI scoring for Task 2:', err);
        }
      });
      
      // Start polling for results
      this.fetchResultsWithRetry(task1Result.id, task2Result.id, 0);
    }).catch(err => {
      console.error('❌ Error submitting mock test:', err);
      alert('Có lỗi xảy ra khi nộp bài thi. Vui lòng thử lại.');
      this.submitting.set(false);
      this.waitingForAiScoring.set(false);
    });
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  sanitizeHtml(html: string | null | undefined): SafeHtml {
    if (!html) {
      return this.sanitizer.sanitize(1, '') as SafeHtml;
    }
    return this.sanitizer.sanitize(1, html) as SafeHtml;
  }

  goToWritingHistory() {
    this.router.navigate(['/writing/history']);
  }

  viewTaskDetail(historyId: number) {
    // Save current URL to sessionStorage so detail page knows where to go back
    sessionStorage.setItem('writing_history_previous_url', '/writing/mock-test/start');
    // Set flag to indicate we're going to detail page, so we can restore state when coming back
    sessionStorage.setItem('coming_back_from_mock_test_detail', 'true');
    this.router.navigate(['/writing/history', historyId]);
  }

  startNewMockTest() {
    // Clear saved state
    sessionStorage.removeItem('mock_test_result_state');
    sessionStorage.removeItem('coming_back_from_mock_test_detail');
    // Navigate back to landing page
    this.router.navigate(['/writing/mock-test']);
  }
  
  goToMockTestHistory() {
    this.router.navigate(['/writing/mock-test/history']);
  }

  private fetchResultsWithRetry(task1Id: number, task2Id: number, attempt: number) {
    // Tăng thời gian retry: 30 attempts với delay tăng dần = ~3-4 phút tổng cộng
    // Điều này đủ cho AI scoring với retry logic ở backend (3 lần retry x 2-8 giây mỗi lần)
    const maxAttempts = 30;
    // Delay tăng dần: 3s, 4s, 5s, 6s... để tránh spam server
    const baseDelay = 3000;
    const delay = baseDelay + (attempt * 1000); // 3s, 4s, 5s, 6s...
    const maxDelay = 8000; // Max 8 seconds between attempts
    const actualDelay = Math.min(delay, maxDelay);

    if (attempt >= maxAttempts) {
      // Max attempts reached, show results anyway but continue polling in background
      console.warn(`⚠️ Max retry attempts reached (${maxAttempts}), showing results without AI scores`);
      console.log('📊 Will continue polling in background for AI scores...');
      
      // Show results immediately
      this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task1Id}`).subscribe(task1 => {
        this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task2Id}`).subscribe(task2 => {
          this.showResults(task1, task2);
          
          // Continue polling in background (every 10 seconds) for up to 2 more minutes
          this.continuePollingInBackground(task1Id, task2Id, 0, 12); // 12 attempts x 10s = 2 minutes
        });
      });
      return;
    }

    // Fetch both results
    Promise.all([
      firstValueFrom(this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task1Id}`)),
      firstValueFrom(this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task2Id}`))
    ]).then(([task1Final, task2Final]) => {
      // Check if both have AI scores
      const task1HasScore = task1Final.aiScore != null && task1Final.aiScore > 0;
      const task2HasScore = task2Final.aiScore != null && task2Final.aiScore > 0;
      
      if (task1HasScore && task2HasScore) {
        console.log('✅ AI evaluation complete for both tasks!');
        console.log(`📝 Task 1 score: ${task1Final.aiScore}, Task 2 score: ${task2Final.aiScore}`);
        this.waitingForAiScoring.set(false);
        this.showResults(task1Final, task2Final);
      } else {
        // AI still evaluating, retry after delay
        const task1Status = task1HasScore ? '✅' : '⏳';
        const task2Status = task2HasScore ? '✅' : '⏳';
        console.log(`⏳ AI still evaluating... (attempt ${attempt + 1}/${maxAttempts})`);
        console.log(`   Task 1: ${task1Status} ${task1HasScore ? `Score: ${task1Final.aiScore}` : 'Waiting...'}`);
        console.log(`   Task 2: ${task2Status} ${task2HasScore ? `Score: ${task2Final.aiScore}` : 'Waiting...'}`);
        console.log(`   Next retry in ${actualDelay / 1000}s...`);
        
        setTimeout(() => {
          this.fetchResultsWithRetry(task1Id, task2Id, attempt + 1);
        }, actualDelay);
      }
    }).catch(err => {
      console.error('❌ Error fetching results:', err);
      // Retry on error with exponential backoff
      setTimeout(() => {
        this.fetchResultsWithRetry(task1Id, task2Id, attempt + 1);
      }, actualDelay);
    });
  }

  private continuePollingInBackground(task1Id: number, task2Id: number, attempt: number, maxAttempts: number) {
    if (attempt >= maxAttempts) {
      console.log('⏹️ Background polling stopped after max attempts');
      return;
    }

    const delay = 10000; // 10 seconds between background polls

    setTimeout(() => {
      Promise.all([
        firstValueFrom(this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task1Id}`)),
        firstValueFrom(this.http.get<WritingHistoryDto>(`${this.apiUrl}/${task2Id}`))
      ]).then(([task1Final, task2Final]) => {
        const task1HasScore = task1Final.aiScore != null && task1Final.aiScore > 0;
        const task2HasScore = task2Final.aiScore != null && task2Final.aiScore > 0;
        
        if (task1HasScore && task2HasScore) {
          console.log('✅ AI evaluation completed in background! Updating results...');
          this.waitingForAiScoring.set(false);
          this.showResults(task1Final, task2Final);
        } else {
          // Continue polling
          this.continuePollingInBackground(task1Id, task2Id, attempt + 1, maxAttempts);
        }
      }).catch(err => {
        console.error('Error in background polling:', err);
        // Continue polling even on error
        this.continuePollingInBackground(task1Id, task2Id, attempt + 1, maxAttempts);
      });
    }, delay);
  }

  private showResults(task1Final: WritingHistoryDto, task2Final: WritingHistoryDto) {
    const avgScore = task1Final.aiScore && task2Final.aiScore
      ? (task1Final.aiScore + task2Final.aiScore) / 2
      : undefined;

    this.mockTestResult.set({
      task1Result: task1Final,
      task2Result: task2Final,
      averageScore: avgScore
    });

    this.testCompleted.set(true);
    this.submitting.set(false);
    
    // Save state to sessionStorage so it persists when navigating away
    this.saveStateToSession();
  }
}

