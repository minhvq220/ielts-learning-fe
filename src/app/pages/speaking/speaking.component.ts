import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface SpeakingQuestion {
  id: number;
  part: 1 | 2 | 3;
  question: string;
  preparationTime?: number; // for Part 2
  speakingTime?: number; // for Part 2
  notes: string;
  recording: string;
  userAnswer: string;
}

interface SpeakingEvaluation {
  overallScore: number;
  pronunciation: number;
  grammar: number;
  vocabulary: number;
  fluency: number;
  feedback: string;
  pronunciationDetails: {
    word: string;
    userPronunciation: string;
    correctPronunciation: string;
    phonetic: string;
  }[];
  suggestions: string[];
  sampleAnswer: string;
  vocabularySuggestions: string[];
}

@Component({
  selector: 'app-speaking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="speaking-container">
      <div class="speaking-header">
        <div class="test-info">
          <h2>IELTS Speaking Test</h2>
          <span class="test-type">Part 1, 2 & 3</span>
        </div>
        <div class="timer-section">
          <div class="timer" [class.warning]="timeLeft() < 300">
            {{ formatTime(timeLeft()) }}
          </div>
          <div class="timer-controls">
            <button class="btn btn-sm" (click)="toggleTimer()">
              {{ isTimerRunning() ? 'Tạm dừng' : 'Tiếp tục' }}
            </button>
            <button class="btn btn-sm btn-primary" (click)="evaluateSpeaking()">
              AI Chấm bài
            </button>
            <button class="btn btn-sm btn-danger" (click)="submitTest()">Nộp bài</button>
          </div>
        </div>
      </div>

      <div class="speaking-content">
        <div class="question-panel">
          <div class="part-selector">
            <button 
              class="part-btn"
              [class.active]="currentPart() === 1"
              (click)="switchPart(1)">
              Part 1
            </button>
            <button 
              class="part-btn"
              [class.active]="currentPart() === 2"
              (click)="switchPart(2)">
              Part 2
            </button>
            <button 
              class="part-btn"
              [class.active]="currentPart() === 3"
              (click)="switchPart(3)">
              Part 3
            </button>
          </div>

          <div class="question-content">
            <div class="question-header">
              <h3>{{ getCurrentQuestion()?.part === 1 ? 'Part 1: Introduction & Interview' : 
                        getCurrentQuestion()?.part === 2 ? 'Part 2: Individual Long Turn' : 
                        'Part 3: Two-way Discussion' }}</h3>
              <div class="question-info" *ngIf="getCurrentQuestion()?.part === 2">
                <span>Thời gian chuẩn bị: {{ getCurrentQuestion()?.preparationTime }} phút</span>
                <span>Thời gian nói: {{ getCurrentQuestion()?.speakingTime }} phút</span>
              </div>
            </div>

            <div class="question-text">
              <h4>{{ getCurrentQuestion()?.question }}</h4>
            </div>

            <div class="recording-section">
              <div class="recording-controls">
                <button 
                  class="btn btn-primary btn-record"
                  [class.recording]="isRecording()"
                  (click)="toggleRecording()">
                  {{ isRecording() ? '■ Dừng ghi âm' : 'Bắt đầu ghi âm' }}
                </button>
                <button 
                  class="btn btn-secondary"
                  (click)="playRecording()"
                  [disabled]="!hasRecording()">
                  ▶️ Phát lại
                </button>
                <button 
                  class="btn btn-secondary"
                  (click)="clearRecording()"
                  [disabled]="!hasRecording()">
                  🗑️ Xóa
                </button>
              </div>
              
              <div class="recording-status" *ngIf="isRecording()">
                <div class="recording-indicator">
                  <span class="recording-dot"></span>
                  Đang ghi âm... {{ formatTime(recordingTime()) }}
                </div>
              </div>
            </div>

            <div class="notes-section">
              <h4>Ghi chú & Nháp</h4>
              <textarea 
                [(ngModel)]="getCurrentQuestion()!.notes"
                placeholder="Ghi chú ý tưởng, từ vựng quan trọng..."
                class="notes-textarea">
              </textarea>
            </div>

            <div class="answer-section">
              <h4>Câu trả lời của bạn</h4>
              <textarea 
                [(ngModel)]="getCurrentQuestion()!.userAnswer"
                placeholder="Viết lại câu trả lời của bạn sau khi ghi âm..."
                class="answer-textarea">
              </textarea>
            </div>

            <div class="question-navigation">
              <button 
                class="btn btn-secondary" 
                (click)="previousQuestion()"
                [disabled]="currentQuestionIndex() === 0">
                Câu trước
              </button>
              <button 
                class="btn btn-primary" 
                (click)="nextQuestion()"
                [disabled]="currentQuestionIndex() === getPartQuestions().length - 1">
                Câu tiếp
              </button>
            </div>
          </div>
        </div>

        <div class="evaluation-panel" *ngIf="evaluation()">
          <div class="evaluation-header">
            <h3>Kết quả AI Chấm bài</h3>
            <div class="overall-score">
              <span class="score-label">Điểm tổng:</span>
              <span class="score-value">{{ evaluation()!.overallScore }}/9</span>
            </div>
          </div>

          <div class="criteria-scores">
            <div class="criteria-item">
              <span class="criteria-name">Pronunciation</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.pronunciation / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.pronunciation }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Grammar</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.grammar / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.grammar }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Vocabulary</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.vocabulary / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.vocabulary }}/9</span>
              </div>
            </div>
            <div class="criteria-item">
              <span class="criteria-name">Fluency</span>
              <div class="score-bar">
                <div class="score-fill" [style.width.%]="(evaluation()!.fluency / 9) * 100"></div>
                <span class="score-text">{{ evaluation()!.fluency }}/9</span>
              </div>
            </div>
          </div>

          <div class="feedback-section">
            <h4>Nhận xét chi tiết:</h4>
            <p class="feedback-text">{{ evaluation()!.feedback }}</p>
          </div>

          <div class="pronunciation-details" *ngIf="evaluation()!.pronunciationDetails.length > 0">
            <h4>Chi tiết phát âm:</h4>
            <div class="pronunciation-list">
              <div *ngFor="let detail of evaluation()!.pronunciationDetails" class="pronunciation-item">
                <div class="word-info">
                  <span class="word">{{ detail.word }}</span>
                  <span class="phonetic">{{ detail.phonetic }}</span>
                </div>
                <div class="pronunciation-comparison">
                  <span class="user-pronunciation">Bạn: {{ detail.userPronunciation }}</span>
                  <span class="correct-pronunciation">Đúng: {{ detail.correctPronunciation }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="suggestions-section">
            <h4>Gợi ý cải thiện:</h4>
            <ul class="suggestions-list">
              <li *ngFor="let suggestion of evaluation()!.suggestions">{{ suggestion }}</li>
            </ul>
          </div>

          <div class="vocabulary-suggestions" *ngIf="evaluation()!.vocabularySuggestions.length > 0">
            <h4>Từ vựng nên học:</h4>
            <div class="vocabulary-list">
              <span *ngFor="let vocab of evaluation()!.vocabularySuggestions" class="vocab-item">
                {{ vocab }}
              </span>
            </div>
          </div>

          <div class="sample-answer-section">
            <h4>Câu trả lời mẫu:</h4>
            <div class="sample-answer">{{ evaluation()!.sampleAnswer }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .speaking-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .speaking-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: white;
      border-bottom: 1px solid #ddd;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .test-info h2 {
      margin: 0;
      color: #2c3e50;
    }

    .test-type {
      color: #666;
      font-size: 0.9rem;
    }

    .timer-section {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .timer {
      font-size: 1.5rem;
      font-weight: bold;
      color: #28a745;
      padding: 0.5rem 1rem;
      background: #f8f9fa;
      border-radius: 0;
    }

    .timer.warning {
      color: #dc3545;
      background: #f8d7da;
    }

    .timer-controls {
      display: flex;
      gap: 0.5rem;
    }

    .speaking-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .question-panel {
      flex: 1;
      padding: 2rem;
      background: white;
      overflow-y: auto;
      border-right: 1px solid #ddd;
    }

    .part-selector {
      display: flex;
      margin-bottom: 2rem;
      background: #f8f9fa;
      border-radius: 0;
      padding: 4px;
    }

    .part-btn {
      flex: 1;
      padding: 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      border-radius: 0;
    }

    .part-btn.active {
      background: #0d9488;
      color: white;
    }

    .part-btn:hover:not(.active) {
      background: #e9ecef;
    }

    .question-content {
      max-width: 800px;
    }

    .question-header h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .question-info {
      display: flex;
      gap: 2rem;
      margin-bottom: 1rem;
      font-size: 0.9rem;
      color: #666;
    }

    .question-text {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 0;
      margin-bottom: 2rem;
      border-left: 4px solid #0d9488;
    }

    .question-text h4 {
      margin: 0;
      color: #2c3e50;
      line-height: 1.6;
    }

    .recording-section {
      margin-bottom: 2rem;
    }

    .recording-controls {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .btn-record {
      position: relative;
      overflow: hidden;
    }

    .btn-record.recording {
      background: #dc3545;
      animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
      0% { transform: scale(1); }
      50% { transform: scale(1.05); }
      100% { transform: scale(1); }
    }

    .recording-status {
      padding: 1rem;
      background: #f8d7da;
      border-radius: 0;
      border-left: 4px solid #dc3545;
    }

    .recording-indicator {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #721c24;
      font-weight: 500;
    }

    .recording-dot {
      width: 12px;
      height: 12px;
      background: #dc3545;
      border-radius: 0;
      animation: blink 1s infinite;
    }

    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }

    .notes-section,
    .answer-section {
      margin-bottom: 2rem;
    }

    .notes-section h4,
    .answer-section h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .notes-textarea,
    .answer-textarea {
      width: 100%;
      min-height: 120px;
      padding: 1rem;
      border: 1px solid #ddd;
      border-radius: 0;
      font-size: 1rem;
      line-height: 1.6;
      resize: vertical;
    }

    .notes-textarea:focus,
    .answer-textarea:focus {
      outline: none;
      border-color: #0d9488;
      box-shadow: 0 0 0 3px rgba(0,123,255,0.1);
    }

    .question-navigation {
      display: flex;
      justify-content: space-between;
    }

    .evaluation-panel {
      width: 400px;
      padding: 2rem;
      background: #f8f9fa;
      overflow-y: auto;
    }

    .evaluation-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #ddd;
    }

    .evaluation-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .overall-score {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .score-label {
      font-size: 0.9rem;
      color: #666;
    }

    .score-value {
      font-size: 2rem;
      font-weight: bold;
      color: #28a745;
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
      border-radius: 0;
      overflow: hidden;
    }

    .score-fill {
      height: 100%;
      background: #0d9488;
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
    .pronunciation-details,
    .suggestions-section,
    .vocabulary-suggestions,
    .sample-answer-section {
      margin-bottom: 2rem;
    }

    .feedback-section h4,
    .pronunciation-details h4,
    .suggestions-section h4,
    .vocabulary-suggestions h4,
    .sample-answer-section h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .feedback-text {
      line-height: 1.6;
      color: #666;
    }

    .pronunciation-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .pronunciation-item {
      background: white;
      padding: 1rem;
      border-radius: 0;
      border-left: 4px solid #ffc107;
    }

    .word-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .word {
      font-weight: bold;
      color: #2c3e50;
    }

    .phonetic {
      font-style: italic;
      color: #666;
    }

    .pronunciation-comparison {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      font-size: 0.9rem;
    }

    .user-pronunciation {
      color: #dc3545;
    }

    .correct-pronunciation {
      color: #28a745;
    }

    .suggestions-list {
      margin: 0;
      padding-left: 1.5rem;
    }

    .suggestions-list li {
      margin-bottom: 0.5rem;
      line-height: 1.5;
    }

    .vocabulary-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .vocab-item {
      background: #0d9488;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 0;
      font-size: 0.9rem;
    }

    .sample-answer {
      background: white;
      padding: 1rem;
      border-radius: 0;
      line-height: 1.6;
      font-style: italic;
      border-left: 4px solid #28a745;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    }

    .btn-primary {
      background: #0d9488;
      color: white;
    }

    .btn-primary:hover {
      background: #0056b3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover {
      background: #545b62;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .speaking-content {
        flex-direction: column;
      }

      .evaluation-panel {
        width: 100%;
        height: 50vh;
      }
    }
  `]
})
export class SpeakingComponent {
  // Signals
  timeLeft = signal(900); // 15 minutes total
  isTimerRunning = signal(true);
  currentPart = signal(1);
  currentQuestionIndex = signal(0);
  isRecording = signal(false);
  recordingTime = signal(0);
  evaluation = signal<SpeakingEvaluation | null>(null);

  // Questions data
  questions = signal<SpeakingQuestion[]>([
    // Part 1
    {
      id: 1,
      part: 1,
      question: "What's your name?",
      notes: '',
      recording: '',
      userAnswer: ''
    },
    {
      id: 2,
      part: 1,
      question: "Where are you from?",
      notes: '',
      recording: '',
      userAnswer: ''
    },
    {
      id: 3,
      part: 1,
      question: "Do you work or study?",
      notes: '',
      recording: '',
      userAnswer: ''
    },
    // Part 2
    {
      id: 4,
      part: 2,
      question: "Describe a memorable trip you have taken. You should say: where you went, who you went with, what you did there, and explain why this trip was memorable for you.",
      preparationTime: 1,
      speakingTime: 2,
      notes: '',
      recording: '',
      userAnswer: ''
    },
    // Part 3
    {
      id: 5,
      part: 3,
      question: "How has tourism changed in your country over the past few decades?",
      notes: '',
      recording: '',
      userAnswer: ''
    },
    {
      id: 6,
      part: 3,
      question: "What are the advantages and disadvantages of tourism for local communities?",
      notes: '',
      recording: '',
      userAnswer: ''
    }
  ]);

  constructor() {
    // Start timer
    setInterval(() => {
      if (this.isTimerRunning()) {
        const current = this.timeLeft();
        if (current > 0) {
          this.timeLeft.set(current - 1);
        } else {
          this.submitTest();
        }
      }
    }, 1000);

    // Recording timer
    setInterval(() => {
      if (this.isRecording()) {
        this.recordingTime.set(this.recordingTime() + 1);
      }
    }, 1000);
  }

  formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleTimer(): void {
    this.isTimerRunning.set(!this.isTimerRunning());
  }

  switchPart(part: number): void {
    this.currentPart.set(part);
    this.currentQuestionIndex.set(0);
    this.evaluation.set(null);
  }

  getPartQuestions(): SpeakingQuestion[] {
    return this.questions().filter(q => q.part === this.currentPart());
  }

  getCurrentQuestion(): SpeakingQuestion | undefined {
    const partQuestions = this.getPartQuestions();
    return partQuestions[this.currentQuestionIndex()];
  }

  nextQuestion(): void {
    const partQuestions = this.getPartQuestions();
    if (this.currentQuestionIndex() < partQuestions.length - 1) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestionIndex() > 0) {
      this.currentQuestionIndex.set(this.currentQuestionIndex() - 1);
    }
  }

  toggleRecording(): void {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      this.startRecording();
    }
  }

  startRecording(): void {
    this.isRecording.set(true);
    this.recordingTime.set(0);
    console.log('Started recording...');
  }

  stopRecording(): void {
    this.isRecording.set(false);
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      currentQuestion.recording = `recording_${Date.now()}.wav`;
    }
    console.log('Stopped recording...');
  }

  playRecording(): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion?.recording) {
      console.log('Playing recording:', currentQuestion.recording);
    }
  }

  clearRecording(): void {
    const currentQuestion = this.getCurrentQuestion();
    if (currentQuestion) {
      currentQuestion.recording = '';
    }
  }

  hasRecording(): boolean {
    const currentQuestion = this.getCurrentQuestion();
    return currentQuestion?.recording ? true : false;
  }

  evaluateSpeaking(): void {
    const currentQuestion = this.getCurrentQuestion();
    if (!currentQuestion || (!currentQuestion.recording && !currentQuestion.userAnswer.trim())) {
      alert('Vui lòng ghi âm hoặc viết câu trả lời trước khi chấm bài!');
      return;
    }

    // Simulate AI evaluation
    const mockEvaluation: SpeakingEvaluation = {
      overallScore: Math.floor(Math.random() * 3) + 6, // 6-8
      pronunciation: Math.floor(Math.random() * 3) + 6,
      grammar: Math.floor(Math.random() * 3) + 6,
      vocabulary: Math.floor(Math.random() * 3) + 6,
      fluency: Math.floor(Math.random() * 3) + 6,
      feedback: `Phát âm của bạn khá tốt, tuy nhiên cần chú ý đến một số từ. Ngữ pháp và từ vựng đa dạng. Cần cải thiện độ trôi chảy.`,
      pronunciationDetails: [
        {
          word: 'memorable',
          userPronunciation: 'memor-able',
          correctPronunciation: 'mem-er-able',
          phonetic: '/ˈmemərəbl/'
        },
        {
          word: 'tourism',
          userPronunciation: 'tour-ism',
          correctPronunciation: 'tour-ism',
          phonetic: '/ˈtʊərɪzəm/'
        }
      ],
      suggestions: [
        'Luyện tập phát âm các từ có âm tiết dài',
        'Sử dụng nhiều từ nối để tăng độ trôi chảy',
        'Mở rộng vốn từ vựng về chủ đề du lịch',
        'Chú ý đến ngữ điệu khi nói'
      ],
      sampleAnswer: `This is a high-quality sample answer that demonstrates excellent pronunciation, grammar, vocabulary, and fluency. The response is well-structured and shows a high level of English proficiency.`,
      vocabularySuggestions: ['memorable', 'destination', 'adventure', 'experience', 'fascinating']
    };

    this.evaluation.set(mockEvaluation);
  }

  submitTest(): void {
    const completedQuestions = this.questions().filter(q => q.recording || q.userAnswer.trim()).length;
    const totalQuestions = this.questions().length;
    
    console.log(`Completed questions: ${completedQuestions}/${totalQuestions}`);
    
    alert(`Bạn đã hoàn thành ${completedQuestions}/${totalQuestions} câu hỏi speaking.`);
  }
}
