import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Question {
  id: number;
  type: 'multiple-choice' | 'true-false' | 'fill-blank' | 'matching';
  question: string;
  options?: string[];
  answer?: string;
  userAnswer?: string;
}

interface WordDefinition {
  word: string;
  pronunciation: string;
  type: string;
  meaning: string;
  context: string;
  example: string;
  translation: string;
}

@Component({
  selector: 'app-reading',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="reading-container">
      <div class="reading-header">
        <div class="test-info">
          <h2>IELTS Reading Test</h2>
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

      <div class="reading-content">
        <div class="passage-section">
          <div class="passage-header">
            <h3>Passage 1: The History of Chocolate</h3>
            <div class="mode-toggle">
              <button 
                class="mode-btn" 
                [class.active]="!isDictionaryMode()"
                (click)="setDictionaryMode(false)">
                Chế độ thi
              </button>
              <button 
                class="mode-btn" 
                [class.active]="isDictionaryMode()"
                (click)="setDictionaryMode(true)">
                Tra từ
              </button>
            </div>
          </div>
          
          <div class="passage-text" 
               [class.dictionary-mode]="isDictionaryMode()"
               (click)="onTextClick($event)">
            <p>
              Chocolate has a long and fascinating history that dates back thousands of years. 
              The ancient Maya and Aztec civilizations were among the first to cultivate 
              <span class="word" data-word="cacao">cacao</span> trees and use the beans to create 
              a bitter beverage. This early form of chocolate was quite different from the 
              sweet treats we enjoy today.
            </p>
            <p>
              The Spanish conquistadors brought chocolate to Europe in the 16th century, 
              where it was initially consumed as a luxury drink among the aristocracy. 
              It wasn't until the Industrial Revolution that chocolate became more 
              <span class="word" data-word="accessible">accessible</span> to the general public.
            </p>
            <p>
              Today, chocolate is one of the world's most popular foods, with millions of 
              people enjoying it in various forms. From dark chocolate bars to milk chocolate 
              truffles, the <span class="word" data-word="versatility">versatility</span> of 
              chocolate continues to amaze consumers worldwide.
            </p>
          </div>
        </div>

        <div class="questions-section">
          <div class="questions-header">
            <h3>Câu hỏi (1-13)</h3>
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

              <div *ngIf="getCurrentQuestion()!.type === 'true-false'" class="true-false">
                <label>
                  <input 
                    type="radio" 
                    name="question{{ getCurrentQuestion()!.id }}"
                    value="TRUE"
                    [(ngModel)]="getCurrentQuestion()!.userAnswer">
                  TRUE
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="question{{ getCurrentQuestion()!.id }}"
                    value="FALSE"
                    [(ngModel)]="getCurrentQuestion()!.userAnswer">
                  FALSE
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="question{{ getCurrentQuestion()!.id }}"
                    value="NOT GIVEN"
                    [(ngModel)]="getCurrentQuestion()!.userAnswer">
                  NOT GIVEN
                </label>
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

      <!-- Dictionary Modal -->
      <div class="dictionary-modal" *ngIf="selectedWord()" (click)="closeDictionary()">
        <div class="dictionary-content" (click)="$event.stopPropagation()">
          <div class="dictionary-header">
            <h3>{{ selectedWord()!.word }}</h3>
            <button class="close-btn" (click)="closeDictionary()">×</button>
          </div>
          <div class="dictionary-body">
            <div class="pronunciation">
              <strong>Phát âm:</strong> {{ selectedWord()!.pronunciation }}
            </div>
            <div class="word-type">
              <strong>Loại từ:</strong> {{ selectedWord()!.type }}
            </div>
            <div class="meaning">
              <strong>Nghĩa:</strong> {{ selectedWord()!.meaning }}
            </div>
            <div class="context">
              <strong>Context:</strong> {{ selectedWord()!.context }}
            </div>
            <div class="example">
              <strong>Ví dụ:</strong> {{ selectedWord()!.example }}
            </div>
            <div class="translation">
              <strong>Dịch:</strong> {{ selectedWord()!.translation }}
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reading-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .reading-header {
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

    .reading-content {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    .passage-section {
      flex: 1;
      padding: 2rem;
      background: white;
      overflow-y: auto;
      border-right: 1px solid #ddd;
    }

    .passage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
    }

    .passage-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .mode-toggle {
      display: flex;
      background: #f8f9fa;
      border-radius: 8px;
      padding: 4px;
    }

    .mode-btn {
      padding: 0.5rem 1rem;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.3s;
    }

    .mode-btn.active {
      background: #007bff;
      color: white;
    }

    .passage-text {
      line-height: 1.8;
      font-size: 1.1rem;
    }

    .passage-text.dictionary-mode .word {
      cursor: pointer;
      background: #e3f2fd;
      padding: 2px 4px;
      border-radius: 4px;
      transition: background 0.3s;
    }

    .passage-text.dictionary-mode .word:hover {
      background: #bbdefb;
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

    .true-false label {
      display: inline-block;
      margin-right: 1rem;
      cursor: pointer;
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

    .dictionary-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .dictionary-content {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
      overflow-y: auto;
    }

    .dictionary-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #ddd;
    }

    .dictionary-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .dictionary-body {
      padding: 1.5rem;
    }

    .dictionary-body > div {
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .reading-content {
        flex-direction: column;
      }

      .questions-section {
        width: 100%;
        height: 50vh;
      }

      .passage-section {
        height: 50vh;
      }
    }
  `]
})
export class ReadingComponent {
  // Signals
  timeLeft = signal(3600); // 60 minutes in seconds
  isTimerRunning = signal(true);
  isDictionaryMode = signal(false);
  currentQuestion = signal(1);
  selectedWord = signal<WordDefinition | null>(null);

  // Questions data
  questions = signal<Question[]>([
    {
      id: 1,
      type: 'multiple-choice',
      question: 'What was chocolate originally used for?',
      options: ['Medicine', 'Religious ceremonies', 'Currency', 'Decoration'],
      answer: 'Religious ceremonies'
    },
    {
      id: 2,
      type: 'true-false',
      question: 'Chocolate was first consumed as a sweet treat.',
      answer: 'FALSE'
    },
    {
      id: 3,
      type: 'fill-blank',
      question: 'The Spanish conquistadors brought chocolate to Europe in the _____ century.',
      answer: '16th'
    }
  ]);

  // Dictionary data
  private dictionary: { [key: string]: WordDefinition } = {
    'cacao': {
      word: 'cacao',
      pronunciation: '/kəˈkaʊ/',
      type: 'noun',
      meaning: 'the seeds of a tropical tree, used to make chocolate',
      context: 'The ancient Maya cultivated cacao trees for their beans.',
      example: 'The cacao beans were ground to make a bitter drink.',
      translation: 'hạt ca cao'
    },
    'accessible': {
      word: 'accessible',
      pronunciation: '/əkˈsesəbl/',
      type: 'adjective',
      meaning: 'easy to reach, enter, or obtain',
      context: 'Chocolate became more accessible to the general public.',
      example: 'The new library is accessible to everyone.',
      translation: 'có thể tiếp cận được'
    },
    'versatility': {
      word: 'versatility',
      pronunciation: '/ˌvɜːrsəˈtɪləti/',
      type: 'noun',
      meaning: 'the ability to adapt or be adapted to many different functions or activities',
      context: 'The versatility of chocolate continues to amaze consumers.',
      example: 'Her versatility as an actress is impressive.',
      translation: 'tính đa dạng, linh hoạt'
    }
  };

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

  setDictionaryMode(mode: boolean): void {
    this.isDictionaryMode.set(mode);
  }

  onTextClick(event: MouseEvent): void {
    if (!this.isDictionaryMode()) return;
    
    const target = event.target as HTMLElement;
    if (target.classList.contains('word')) {
      const word = target.getAttribute('data-word');
      if (word && this.dictionary[word]) {
        this.selectedWord.set(this.dictionary[word]);
      }
    }
  }

  closeDictionary(): void {
    this.selectedWord.set(null);
  }

  getCurrentQuestion(): Question | undefined {
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
