import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ListeningQuestion {
  id: number;
  type: 'multiple-choice' | 'fill-blank' | 'matching';
  question: string;
  options?: string[];
  answer?: string;
  userAnswer?: string;
  audioStartTime?: number;
  audioEndTime?: number;
}

@Component({
  selector: 'app-listening',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="listening-container">
      <div class="listening-header">
        <div class="test-info">
          <h2>IELTS Listening Test</h2>
          <span class="test-type">Cambridge 15 - Test 1</span>
        </div>
        <div class="timer-section">
          <div class="timer" [class.warning]="timeLeft() < 300">
            {{ formatTime(timeLeft()) }}
          </div>
          <div class="timer-controls">
            <button class="btn btn-sm" (click)="toggleTimer()">
              {{ isTimerRunning() ? 'Tạm dừng' : 'Tiếp tục' }}
            </button>
            <button class="btn btn-sm btn-danger" (click)="submitTest()">Nộp bài</button>
          </div>
        </div>
      </div>

      <div class="listening-content">
        <div class="audio-section">
          <div class="audio-header">
            <h3>Section 1: Conversation about accommodation</h3>
            <div class="audio-controls">
              <button class="btn btn-primary" (click)="playAudio()" [disabled]="isPlaying()">
                {{ isPlaying() ? 'Đang phát...' : 'Phát audio' }}
              </button>
              <button class="btn btn-secondary" (click)="pauseAudio()" [disabled]="!isPlaying()">
                Tạm dừng
              </button>
              <button class="btn btn-secondary" (click)="stopAudio()">
                Dừng
              </button>
            </div>
          </div>
          
          <div class="audio-player">
            <div class="progress-bar">
              <div class="progress-fill" [style.width.%]="audioProgress()"></div>
            </div>
            <div class="time-display">
              <span>{{ formatTime(audioCurrentTime()) }}</span>
              <span>{{ formatTime(audioDuration()) }}</span>
            </div>
            <div class="volume-control">
              <label>Âm lượng:</label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                [(ngModel)]="volume"
                (input)="setVolume($event)">
              <span>{{ volume }}%</span>
            </div>
          </div>

          <div class="instructions">
            <h4>Hướng dẫn:</h4>
            <ul>
              <li>Bạn sẽ nghe một đoạn hội thoại về việc tìm chỗ ở</li>
              <li>Audio sẽ được phát 2 lần</li>
              <li>Trả lời các câu hỏi từ 1-10</li>
              <li>Viết câu trả lời vào phiếu trả lời</li>
            </ul>
          </div>
        </div>

        <div class="questions-section">
          <div class="questions-header">
            <h3>Câu hỏi (1-10)</h3>
            <div class="question-nav">
              <button 
                *ngFor="let q of questions()" 
                class="nav-btn"
                [class.answered]="q.userAnswer"
                [class.current]="currentQuestion() === q.id"
                (click)="goToQuestion(q.id)">
                {{ q.id }}
              </button>
            </div>
          </div>

          <div class="question-content">
            <div class="question-item" *ngIf="getCurrentQuestion()">
              <h4>Câu {{ getCurrentQuestion()!.id }}</h4>
              <p>{{ getCurrentQuestion()!.question }}</p>
              
              <div *ngIf="getCurrentQuestion()!.type === 'multiple-choice'" class="options">
                <label *ngFor="let option of getCurrentQuestion()!.options; let i = index">
                  <input 
                    type="radio" 
                    name="question{{ getCurrentQuestion()!.id }}"
                    [value]="option"
                    [(ngModel)]="getCurrentQuestion()!.userAnswer">
                  {{ getOptionLabel(i) }}. {{ option }}
                </label>
              </div>

              <div *ngIf="getCurrentQuestion()!.type === 'fill-blank'" class="fill-blank">
                <input 
                  type="text" 
                  [(ngModel)]="getCurrentQuestion()!.userAnswer"
                  placeholder="Nhập câu trả lời...">
              </div>

              <div *ngIf="getCurrentQuestion()!.type === 'matching'" class="matching">
                <div class="matching-options">
                  <div *ngFor="let option of getCurrentQuestion()!.options; let i = index" class="matching-item">
                    <span>{{ getOptionLabel(i) }}. {{ option }}</span>
                    <input 
                      type="text" 
                      [(ngModel)]="getCurrentQuestion()!.userAnswer"
                      placeholder="Nhập đáp án...">
                  </div>
                </div>
              </div>
            </div>

            <div class="question-navigation">
              <button 
                class="btn btn-secondary" 
                (click)="previousQuestion()"
                [disabled]="currentQuestion() === 1">
                Câu trước
              </button>
              <button 
                class="btn btn-primary" 
                (click)="nextQuestion()"
                [disabled]="currentQuestion() === questions().length">
                Câu tiếp
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Audio Element (hidden) -->
      <audio 
        #audioPlayer
        (timeupdate)="updateProgress()"
        (ended)="onAudioEnded()"
        (loadedmetadata)="onAudioLoaded()">
        <source src="assets/audio/listening-test-1.mp3" type="audio/mpeg">
        Your browser does not support the audio element.
      </audio>
    </div>
  `,
  styles: [`
    .listening-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .listening-header {
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
      border-radius: 8px;
    }

    .timer.warning {
      color: #dc3545;
      background: #f8d7da;
    }

    .timer-controls {
      display: flex;
      gap: 0.5rem;
    }

    .listening-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .audio-section {
      flex: 1;
      padding: 2rem;
      background: white;
      overflow-y: auto;
      border-right: 1px solid #ddd;
    }

    .audio-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .audio-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .audio-controls {
      display: flex;
      gap: 0.5rem;
    }

    .audio-player {
      background: #f8f9fa;
      padding: 2rem;
      border-radius: 12px;
      margin-bottom: 2rem;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #ddd;
      border-radius: 4px;
      margin-bottom: 1rem;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #007bff, #28a745);
      transition: width 0.1s ease;
    }

    .time-display {
      display: flex;
      justify-content: space-between;
      margin-bottom: 1rem;
      font-weight: 500;
    }

    .volume-control {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .volume-control input[type="range"] {
      flex: 1;
    }

    .instructions {
      background: #e3f2fd;
      padding: 1.5rem;
      border-radius: 12px;
      border-left: 4px solid #2196f3;
    }

    .instructions h4 {
      margin: 0 0 1rem 0;
      color: #1976d2;
    }

    .instructions ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .instructions li {
      margin-bottom: 0.5rem;
      line-height: 1.6;
    }

    .questions-section {
      width: 400px;
      padding: 2rem;
      background: #f8f9fa;
      overflow-y: auto;
    }

    .questions-header h3 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .question-nav {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 2rem;
    }

    .nav-btn {
      width: 40px;
      height: 40px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.3s;
    }

    .nav-btn:hover {
      background: #e9ecef;
    }

    .nav-btn.answered {
      background: #28a745;
      color: white;
      border-color: #28a745;
    }

    .nav-btn.current {
      background: #007bff;
      color: white;
      border-color: #007bff;
    }

    .question-content {
      background: white;
      padding: 1.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .question-item h4 {
      margin: 0 0 1rem 0;
      color: #2c3e50;
    }

    .question-item p {
      margin-bottom: 1.5rem;
      line-height: 1.6;
    }

    .options label {
      display: block;
      margin-bottom: 0.75rem;
      cursor: pointer;
    }

    .options input[type="radio"] {
      margin-right: 0.5rem;
    }

    .fill-blank input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 1rem;
    }

    .matching-options {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .matching-item {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .matching-item span {
      min-width: 120px;
      font-weight: 500;
    }

    .matching-item input {
      flex: 1;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
    }

    .question-navigation {
      display: flex;
      justify-content: space-between;
      margin-top: 2rem;
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
      .listening-content {
        flex-direction: column;
      }

      .questions-section {
        width: 100%;
        height: 50vh;
      }

      .audio-section {
        height: 50vh;
      }

      .audio-header {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
      }
    }
  `]
})
export class ListeningComponent {
  // Signals
  timeLeft = signal(2400); // 40 minutes in seconds
  isTimerRunning = signal(true);
  currentQuestion = signal(1);
  isPlaying = signal(false);
  audioCurrentTime = signal(0);
  audioDuration = signal(0);
  audioProgress = signal(0);
  volume = 50;

  // Questions data
  questions = signal<ListeningQuestion[]>([
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What type of accommodation is the student looking for?',
      options: ['Shared apartment', 'Studio apartment', 'Family home', 'University dormitory'],
      answer: 'Shared apartment',
      audioStartTime: 0,
      audioEndTime: 30
    },
    {
      id: 2,
      type: 'fill-blank',
      question: 'The monthly rent is £_____',
      answer: '450',
      audioStartTime: 30,
      audioEndTime: 60
    },
    {
      id: 3,
      type: 'multiple-choice',
      question: 'What is included in the rent?',
      options: ['Electricity only', 'Gas and electricity', 'All utilities', 'Internet only'],
      answer: 'Gas and electricity',
      audioStartTime: 60,
      audioEndTime: 90
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
  }

  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  toggleTimer(): void {
    this.isTimerRunning.set(!this.isTimerRunning());
  }

  playAudio(): void {
    // In a real app, you would control the actual audio element
    this.isPlaying.set(true);
    console.log('Playing audio...');
  }

  pauseAudio(): void {
    this.isPlaying.set(false);
    console.log('Paused audio...');
  }

  stopAudio(): void {
    this.isPlaying.set(false);
    this.audioCurrentTime.set(0);
    this.audioProgress.set(0);
    console.log('Stopped audio...');
  }

  setVolume(event: any): void {
    this.volume = event.target.value;
    console.log('Volume set to:', this.volume);
  }

  updateProgress(): void {
    // This would be called by the audio element's timeupdate event
    // For demo purposes, we'll simulate progress
    const progress = (this.audioCurrentTime() / this.audioDuration()) * 100;
    this.audioProgress.set(progress);
  }

  onAudioEnded(): void {
    this.isPlaying.set(false);
    console.log('Audio ended');
  }

  onAudioLoaded(): void {
    // This would be called when audio metadata is loaded
    console.log('Audio loaded');
  }

  getCurrentQuestion(): ListeningQuestion | undefined {
    return this.questions().find(q => q.id === this.currentQuestion());
  }

  goToQuestion(questionId: number): void {
    this.currentQuestion.set(questionId);
  }

  nextQuestion(): void {
    if (this.currentQuestion() < this.questions().length) {
      this.currentQuestion.set(this.currentQuestion() + 1);
    }
  }

  previousQuestion(): void {
    if (this.currentQuestion() > 1) {
      this.currentQuestion.set(this.currentQuestion() - 1);
    }
  }

  getOptionLabel(index: number): string {
    return String.fromCharCode(65 + index);
  }

  submitTest(): void {
    // Calculate score and show results
    const answeredQuestions = this.questions().filter(q => q.userAnswer);
    const correctAnswers = this.questions().filter(q => q.userAnswer === q.answer);
    
    console.log(`Answered: ${answeredQuestions.length}/${this.questions().length}`);
    console.log(`Correct: ${correctAnswers.length}/${this.questions().length}`);
    
    // Here you would typically navigate to results page or show modal
    alert(`Bạn đã hoàn thành ${answeredQuestions.length}/${this.questions().length} câu hỏi. Đúng ${correctAnswers.length} câu.`);
  }
}
