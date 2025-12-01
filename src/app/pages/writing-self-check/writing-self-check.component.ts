import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { WritingHistoryService } from '../../services/writing-history.service';
import { WritingHistoryDto } from '../../services/writing-history-api.service';

// DTO for self-check history (similar to WritingHistoryDto but with taskQuestion)
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
  aiCorrections?: any[];
  aiCorrectedAnswer?: string;
  aiProvider?: string;
  aiModel?: string;
  aiEvaluatedAt?: string;
  aiRequestId?: string;
  aiStatistics?: any;
  aiDetailedScores?: any;
  ipAddress?: string;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
}

interface FileValidationConfig {
  allowedTypes: string[];
  maxSizeBytes: number;
}

@Component({
  selector: 'app-writing-self-check',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="self-check-container">
      <div class="self-check-header">
        <div>
          <h2>Tự kiểm tra Writing</h2>
          <p>Nhập đề bài và bài viết của bạn để được AI chấm điểm</p>
        </div>
        <a routerLink="/writing-self-check/history" class="history-btn">
          <span class="history-icon">📚</span>
          <span>Lịch sử tự kiểm tra</span>
        </a>
      </div>

      <form (ngSubmit)="onSubmit()" class="self-check-form">
        <!-- Task Type Selection -->
        <div class="form-group">
          <label>Loại bài <span class="required">*</span></label>
          <div class="task-type-radio">
            <label class="radio-label">
              <input 
                type="radio" 
                name="taskType"
                value="TASK1"
                [(ngModel)]="taskType"
                (change)="onTaskTypeChange()">
              <span>Task 1 (Có ảnh/biểu đồ)</span>
            </label>
            <label class="radio-label">
              <input 
                type="radio" 
                name="taskType"
                value="TASK2"
                [(ngModel)]="taskType"
                (change)="onTaskTypeChange()">
              <span>Task 2 (Essay)</span>
            </label>
          </div>
        </div>

        <!-- Task Question/Description -->
        <div class="form-group">
          <label for="taskQuestion">
            {{ taskType() === 'TASK1' ? 'Mô tả đề bài / Biểu đồ' : 'Câu hỏi / Đề bài' }} 
            <span class="required">*</span>
          </label>
          <textarea 
            id="taskQuestion"
            [(ngModel)]="taskQuestion" 
            name="taskQuestion"
            class="form-control"
            rows="4"
            [placeholder]="taskType() === 'TASK1' ? 'Nhập mô tả về biểu đồ, bảng, hoặc hình ảnh...' : 'Nhập câu hỏi hoặc đề bài...'"
            required></textarea>
        </div>

        <!-- Image Upload for Task 1 -->
        <div class="form-group" *ngIf="taskType() === 'TASK1'">
          <label for="imageFile">Ảnh/Biểu đồ <span class="required">*</span></label>
          <input 
            type="file" 
            id="imageFile"
            (change)="onImageFileSelected($event)"
            accept="{{ allowedImageTypes }}"
            class="form-control">
          <small class="form-text">
            Loại file cho phép: {{ allowedImageTypes }} | 
            Kích thước tối đa: {{ maxFileSizeMB }} MB
          </small>
          <div *ngIf="fileError()" class="alert alert-error">
            {{ fileError() }}
          </div>
          <div *ngIf="imagePreview() && !fileError()" class="image-preview">
            <img [src]="imagePreview()" alt="Preview" class="preview-img">
            <button type="button" class="btn-remove-image" (click)="removeImage()">Xóa ảnh</button>
          </div>
        </div>

        <!-- User's Writing -->
        <div class="form-group">
          <label for="userAnswer">Bài viết của bạn <span class="required">*</span></label>
          <textarea 
            id="userAnswer"
            [(ngModel)]="userAnswer" 
            name="userAnswer"
            class="form-control writing-textarea"
            rows="15"
            placeholder="Nhập bài viết của bạn ở đây..."
            required></textarea>
          <div class="word-count">
            Số từ: <strong>{{ getWordCount() }}</strong>
          </div>
        </div>

        <!-- Error Message -->
        <div *ngIf="error()" class="alert alert-error">
          {{ error() }}
        </div>

        <!-- Submit Button -->
        <div class="form-actions">
          <button 
            type="submit" 
            class="btn btn-primary"
            [disabled]="isSubmitting() || !isFormValid()">
            <span *ngIf="isSubmitting()">Đang chấm bài...</span>
            <span *ngIf="!isSubmitting()">AI Chấm bài</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .self-check-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem;
    }

    .self-check-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }

    .self-check-header h2 {
      margin: 0 0 0.5rem 0;
      font-size: 1.75rem;
    }

    .self-check-header p {
      color: #666;
      margin: 0;
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

    .self-check-form {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #333;
    }

    .required {
      color: #e74c3c;
    }

    .task-type-radio {
      display: flex;
      gap: 2rem;
    }

    .radio-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-weight: normal;
    }

    .radio-label input[type="radio"] {
      width: auto;
      margin: 0;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-control:focus {
      outline: none;
      border-color: #4a90e2;
      box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
    }

    .writing-textarea {
      font-family: 'Times New Roman', serif;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .word-count {
      margin-top: 0.5rem;
      color: #666;
      font-size: 0.875rem;
    }

    .form-text {
      display: block;
      margin-top: 0.25rem;
      font-size: 0.875rem;
      color: #666;
    }

    .image-preview {
      margin-top: 1rem;
    }

    .preview-img {
      max-width: 100%;
      max-height: 400px;
      border: 1px solid #ddd;
      border-radius: 4px;
      display: block;
    }

    .btn-remove-image {
      margin-top: 0.5rem;
      padding: 0.5rem 1rem;
      background: #e74c3c;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-remove-image:hover {
      background: #c0392b;
    }

    .alert-error {
      padding: 1rem;
      background: #fee;
      border: 1px solid #fcc;
      border-radius: 4px;
      color: #c33;
      margin-bottom: 1rem;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 4px;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #4a90e2;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #357abd;
    }

    .btn-primary:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .history-btn {
        padding: 0.6rem 1.2rem;
        font-size: 0.85rem;
      }
    }
  `]
})
export class WritingSelfCheckComponent {
  private http = inject(HttpClient);
  private historyService = inject(WritingHistoryService);
  router = inject(Router);

  // Form fields
  taskType = signal<'TASK1' | 'TASK2'>('TASK2');
  taskQuestion = signal<string>('');
  userAnswer = signal<string>('');
  imageFile: File | null = null;
  imagePreview = signal<string | null>(null);
  imageBase64 = signal<string | null>(null);
  imageMimeType = signal<string | null>(null);

  // File validation config (will be loaded from backend)
  allowedImageTypes = 'image/jpeg,image/jpg,image/png,image/gif,image/webp';
  maxFileSizeMB = 5; // Default, will be loaded from backend
  maxFileSizeBytes = 5 * 1024 * 1024; // 5MB default

  // State
  isSubmitting = signal<boolean>(false);
  error = signal<string | null>(null);
  fileError = signal<string | null>(null);

  constructor() {
    this.loadFileValidationConfig();
  }

  loadFileValidationConfig(): void {
    // Load file validation config from backend
    this.http.get<FileValidationConfig>('http://localhost:8081/api/writing-self-check/file-validation-config').subscribe({
      next: (config) => {
        this.allowedImageTypes = config.allowedTypes.join(',');
        this.maxFileSizeBytes = config.maxSizeBytes;
        this.maxFileSizeMB = Math.round(config.maxSizeBytes / (1024 * 1024) * 100) / 100;
      },
      error: (err) => {
        console.warn('Could not load file validation config, using defaults:', err);
        // Use defaults already set
      }
    });
  }

  onTaskTypeChange(): void {
    // Clear image when switching to Task 2
    if (this.taskType() === 'TASK2') {
      this.removeImage();
    }
  }

  onImageFileSelected(event: Event): void {
    this.fileError.set(null);
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      
      // Validate file type
      if (!this.isAllowedFileType(file.type)) {
        this.fileError.set(`Loại file không được phép. Chỉ chấp nhận: ${this.allowedImageTypes}`);
        return;
      }

      // Validate file size
      if (file.size > this.maxFileSizeBytes) {
        this.fileError.set(`File quá lớn. Kích thước tối đa: ${this.maxFileSizeMB} MB`);
        return;
      }

      this.imageFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.imagePreview.set(result);
        // Extract base64 data and mime type
        if (result.startsWith('data:')) {
          const parts = result.split(',');
          if (parts.length === 2) {
            const dataUriPrefix = parts[0];
            const mimeTypeMatch = dataUriPrefix.match(/data:([^;]+)/);
            if (mimeTypeMatch) {
              this.imageMimeType.set(mimeTypeMatch[1]);
            }
            this.imageBase64.set(parts[1]);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.imageFile = null;
    this.imagePreview.set(null);
    this.imageBase64.set(null);
    this.imageMimeType.set(null);
    this.fileError.set(null);
    const fileInput = document.getElementById('imageFile') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  isAllowedFileType(fileType: string): boolean {
    const allowedTypes = this.allowedImageTypes.split(',').map(t => t.trim());
    return allowedTypes.includes(fileType);
  }

  getWordCount(): number {
    const text = this.userAnswer().trim();
    if (!text) return 0;
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  isFormValid(): boolean {
    if (!this.taskQuestion().trim() || !this.userAnswer().trim()) {
      return false;
    }
    if (this.taskType() === 'TASK1' && !this.imageBase64()) {
      return false;
    }
    if (this.fileError()) {
      return false;
    }
    return true;
  }

  onSubmit(): void {
    this.error.set(null);
    
    if (!this.isFormValid()) {
      this.error.set('Vui lòng điền đầy đủ thông tin và đảm bảo file ảnh hợp lệ (nếu là Task 1)');
      return;
    }

    this.isSubmitting.set(true);

    const request = {
      taskType: this.taskType(),
      taskQuestion: this.taskQuestion().trim(),
      userAnswer: this.userAnswer().trim(),
      wordCount: this.getWordCount(),
      imageData: this.taskType() === 'TASK1' ? this.imageBase64() : null,
      imageMimeType: this.taskType() === 'TASK1' ? this.imageMimeType() : null
    };

    console.log('Submitting self-check request:', {
      taskType: request.taskType,
      taskQuestionLength: request.taskQuestion.length,
      userAnswerLength: request.userAnswer.length,
      wordCount: request.wordCount,
      hasImage: request.imageData != null,
      imageMimeType: request.imageMimeType
    });

    this.http.post<WritingSelfCheckHistoryDto>('http://localhost:8081/api/writing-self-check/score', request).subscribe({
      next: (result) => {
        console.log('Self-check scoring successful:', result);
        console.log('Result ID:', result?.id);
        console.log('Full result object:', JSON.stringify(result, null, 2));
        
        this.isSubmitting.set(false);
        
        if (result && result.id) {
          console.log('Navigating to history detail with ID:', result.id);
          // Navigate to self-check history detail to show results
          setTimeout(() => {
            this.router.navigate(['/writing-self-check/history', result.id]).then(
              (success) => {
                console.log('Navigation successful:', success);
                if (!success) {
                  console.warn('Navigation returned false, but route might still work');
                }
              },
              (error) => {
                console.error('Navigation failed:', error);
                // Fallback: show success message and navigate manually
                alert('Chấm bài thành công! Đang chuyển đến trang chi tiết...');
                window.location.href = `/writing-self-check/history/${result.id}`;
              }
            );
          }, 100); // Small delay to ensure state is updated
        } else {
          console.error('Result missing ID:', result);
          this.error.set('Chấm bài thành công nhưng không thể chuyển đến trang chi tiết. Vui lòng kiểm tra lịch sử.');
        }
      },
      error: (err) => {
        console.error('Error scoring writing:', err);
        console.error('Error details:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          errorType: typeof err.error,
          errorKeys: err.error ? Object.keys(err.error) : null,
          message: err.message,
          url: err.url
        });
        
        // Log full error object to see structure
        console.error('Full error.error object:', JSON.stringify(err.error, null, 2));
        
        let errorMessage = 'Không thể chấm bài lúc này. Vui lòng thử lại sau.';
        
        // Handle different error response formats
        if (typeof err.error === 'string') {
          // ResponseStatusException returns message as string
          errorMessage = err.error;
        } else if (err.error && typeof err.error === 'object') {
          // Error object - try multiple possible fields
          if (err.error.message) {
            errorMessage = err.error.message;
          } else if (err.error.error) {
            // Some APIs nest error in error.error
            errorMessage = typeof err.error.error === 'string' ? err.error.error : err.error.error.message || errorMessage;
          } else if (err.error.title) {
            // Spring Boot default error format sometimes has title
            errorMessage = err.error.title;
          } else if (err.error.detail) {
            // Spring Boot default error format sometimes has detail
            errorMessage = err.error.detail;
          } else {
            // Try to get first property value that looks like a message
            const errorObj = err.error;
            for (const key in errorObj) {
              if (typeof errorObj[key] === 'string' && errorObj[key].length > 0) {
                errorMessage = errorObj[key];
                break;
              }
            }
          }
        }
        
        // Override with status-specific messages if needed
        if (err.status === 0) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.';
        } else if (err.status === 401 && errorMessage === 'Không thể chấm bài lúc này. Vui lòng thử lại sau.') {
          // If we couldn't extract message from 401, use default
          errorMessage = 'Bạn đã hết lượt chấm bài miễn phí. Vui lòng đăng nhập.';
        }
        
        console.log('Extracted error message:', errorMessage);
        this.error.set(errorMessage);
        this.isSubmitting.set(false);
        
        // Also show alert popup like in "Đề writing" screen
        alert(errorMessage);
      }
    });
  }
}

