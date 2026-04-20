import { Component, Input, Output, EventEmitter, signal, computed, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { 
  WritingTask, 
  WritingTask1, 
  WritingTask2
} from '../../models/writing-task.model';
import {
  WritingTaskApiService,
  WritingTaskTypeOptionDto,
  FALLBACK_TASK1_TYPE_OPTIONS,
  FALLBACK_TASK2_TYPE_OPTIONS
} from '../../services/writing-task-api.service';
import { writingTaskTypeApiToKebab } from '../../services/writing-task.service';
import { RichTextEditorComponent } from '../rich-text-editor/rich-text-editor.component';

@Component({
  selector: 'app-writing-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RichTextEditorComponent],
  template: `
    <div class="modal-overlay" (click)="onCancel()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h2>{{ isEditMode() ? 'Sửa bài viết' : 'Thêm bài viết mới' }}</h2>
          <button class="close-btn" (click)="onCancel()">×</button>
        </div>

        <div class="modal-body">
          <form (ngSubmit)="onSubmit()" #taskForm="ngForm">
            <!-- Task Type Selection -->
            <div class="form-group">
              <label>Loại bài viết *</label>
              <select 
                [(ngModel)]="taskData.type" 
                name="type" 
                required
                (change)="onTaskTypeChange()"
                class="form-control">
                <option value="task1">Task 1 (Academic Writing)</option>
                <option value="task2">Task 2 (Essay Writing)</option>
              </select>
            </div>

            <!-- Task Subtype -->
            <div class="form-group" *ngIf="taskData.type === 'task1'">
              <label>Dạng Task 1 *</label>
              <select 
                [(ngModel)]="taskData.task1Type" 
                name="task1Type" 
                required
                class="form-control">
                <option *ngFor="let o of task1TypeOptions()" [value]="typeOptionKebab(o)">{{ o.label }}</option>
              </select>
            </div>

            <div class="form-group" *ngIf="taskData.type === 'task2'">
              <label>Dạng Task 2 *</label>
              <select 
                [(ngModel)]="taskData.task2Type" 
                name="task2Type" 
                required
                class="form-control">
                <option *ngFor="let o of task2TypeOptions()" [value]="typeOptionKebab(o)">{{ o.label }}</option>
              </select>
            </div>

            <!-- Basic Fields -->
            <div class="form-group">
              <label>Tiêu đề *</label>
              <input 
                type="text" 
                [(ngModel)]="taskData.title" 
                name="title" 
                required
                class="form-control"
                placeholder="Nhập tiêu đề bài viết">
            </div>

            <div class="form-group">
              <label>Đề bài / Câu hỏi *</label>
              <textarea
                [(ngModel)]="taskData.instruction"
                name="instruction"
                required
                rows="4"
                class="form-control"
                placeholder="Nhập nội dung đề bài mà thí sinh sẽ đọc trước khi viết">
              </textarea>
              <p class="form-hint">
                Ví dụ: "The charts below show..." hoặc mô tả ngắn về yêu cầu của đề.
              </p>
            </div>

            <!-- Task-specific fields -->
            <div class="form-group" *ngIf="taskData.type === 'task1'">
              <label>Mô tả</label>
              <textarea 
                [(ngModel)]="taskData.description" 
                name="description"
                rows="3"
                class="form-control"
                placeholder="Mô tả về biểu đồ/dữ liệu"></textarea>
            </div>

            <!-- Image Upload for Task 1 -->
            <div class="form-group" *ngIf="taskData.type === 'task1'">
              <label>Ảnh đính kèm (Biểu đồ/Đồ thị)</label>
              <p class="form-hint image-source-hint">
                Chọn file từ máy <strong>hoặc</strong> dán link ảnh HTTPS (CDN / hệ thống khác). Chỉ cần một trong hai.
              </p>
              <label class="sub-label" for="imageUrlLink">Link ảnh (HTTPS)</label>
              <input
                type="url"
                id="imageUrlLink"
                name="imageUrlLink"
                class="form-control image-url-input"
                [(ngModel)]="imageLinkInput"
                (ngModelChange)="onImageLinkChange($event)"
                placeholder="https://example.com/path/to/chart.png"
                autocomplete="off">
              <div class="image-upload-container">
                <label class="sub-label" for="imageFileInput">Tải file ảnh</label>
                <input 
                  type="file" 
                  id="imageFileInput"
                  #imageInput
                  (change)="onImageSelected($event)"
                  accept="image/*"
                  class="image-input">
                <div class="image-preview" *ngIf="taskData.imageUrl">
                  <img [src]="taskData.imageUrl" alt="Task 1 Image" class="preview-image">
                  <button type="button" class="btn btn-danger btn-sm remove-image-btn" (click)="removeImage()">
                    × Xóa ảnh
                  </button>
                </div>
                <div class="upload-hint" *ngIf="!taskData.imageUrl">
                  Chọn ảnh để đính kèm (JPG, PNG, GIF) — hoặc dán link phía trên
                </div>
              </div>
            </div>

            <div class="form-group" *ngIf="taskData.type === 'task2'">
              <label>Câu hỏi chính *</label>
              <textarea 
                [(ngModel)]="taskData.question" 
                name="question" 
                required
                rows="3"
                class="form-control"
                placeholder="Nhập câu hỏi chính của bài Task 2"></textarea>
            </div>

            <div class="form-group" *ngIf="taskData.type === 'task2'">
              <label>Câu hỏi bổ sung</label>
              <div class="additional-questions">
                <div *ngFor="let question of (taskData.additionalQuestions || []); let i = index" class="question-item">
                  <input 
                    type="text" 
                    [(ngModel)]="taskData.additionalQuestions[i]" 
                    class="form-control"
                    placeholder="Câu hỏi bổ sung">
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeQuestion(i)">×</button>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addQuestion()">
                  + Thêm câu hỏi
                </button>
              </div>
            </div>

            <!-- Configuration Fields -->
            <div class="form-row">
              <div class="form-group">
                <label>Độ khó *</label>
                <select 
                  [(ngModel)]="taskData.difficulty" 
                  name="difficulty" 
                  required
                  class="form-control">
                  <option value="easy">Dễ</option>
                  <option value="medium">Trung bình</option>
                  <option value="hard">Khó</option>
                </select>
              </div>

              <div class="form-group">
                <label>Thời gian (phút) *</label>
                <input 
                  type="number" 
                  [(ngModel)]="taskData.timeLimit" 
                  name="timeLimit" 
                  required
                  min="1"
                  max="60"
                  class="form-control">
              </div>

              <div class="form-group">
                <label>Số từ mục tiêu *</label>
                <input 
                  type="number" 
                  [(ngModel)]="taskData.wordCount" 
                  name="wordCount" 
                  required
                  min="50"
                  max="500"
                  class="form-control">
              </div>

              <div class="form-group">
                <label>Nguồn đề</label>
                <select 
                  [(ngModel)]="taskData.source" 
                  name="source" 
                  class="form-control">
                  <option [ngValue]="undefined">— Chọn nguồn —</option>
                  <option value="CAMBRIDGE">Cambridge</option>
                  <option value="VOL">VOL</option>
                  <option value="ACTUAL_TESTS">Actual Tests</option>
                  <option value="FORECAST">Forecast</option>
                  <option value="OTHERS">Others</option>
                </select>
              </div>
            </div>

            <!-- Tags -->
            <div class="form-group">
              <label>Tags</label>
              <div class="tags-input">
                <div class="tag-list">
                  <span *ngFor="let tag of taskData.tags; let i = index" class="tag">
                    {{ tag }}
                    <button type="button" class="tag-remove" (click)="removeTag(i)">×</button>
                  </span>
                </div>
                <input 
                  type="text" 
                  #tagInput
                  (keyup.enter)="addTag(tagInput.value); tagInput.value = ''"
                  placeholder="Nhập tag và nhấn Enter"
                  class="form-control">
              </div>
            </div>

            <!-- Sample Answer -->
            <div class="form-group">
              <label>Câu trả lời mẫu</label>
              <textarea 
                [(ngModel)]="taskData.sampleAnswer" 
                name="sampleAnswer"
                rows="6"
                class="form-control"
                placeholder="Nhập câu trả lời mẫu"></textarea>
            </div>

            <!-- Writing Guide -->
            <div class="form-group">
              <label>Hướng dẫn viết bài</label>
              <app-rich-text-editor 
                [value]="taskData.writingGuide || ''"
                (valueChange)="taskData.writingGuide = $event">
              </app-rich-text-editor>
            </div>

            <!-- Tips -->
            <div class="form-group">
              <label>Mẹo làm bài</label>
              <div class="tips-input">
                <div *ngFor="let tip of (taskData.tips || []); let i = index" class="tip-item">
                  <input 
                    type="text" 
                    [(ngModel)]="taskData.tips[i]" 
                    class="form-control"
                    placeholder="Nhập mẹo làm bài">
                  <button type="button" class="btn btn-danger btn-sm" (click)="removeTip(i)">×</button>
                </div>
                <button type="button" class="btn btn-secondary btn-sm" (click)="addTip()">
                  + Thêm mẹo
                </button>
              </div>
            </div>

            <!-- Status -->
            <div class="form-group">
              <label class="checkbox-label">
                <input 
                  type="checkbox" 
                  [(ngModel)]="taskData.isActive" 
                  name="isActive">
                <span class="checkmark"></span>
                Kích hoạt bài viết
              </label>
            </div>
          </form>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" (click)="onCancel()">
            Hủy
          </button>
          <button 
            type="button" 
            class="btn btn-primary" 
            (click)="onSubmit()"
            [disabled]="!isFormValid()">
            {{ isEditMode() ? 'Cập nhật' : 'Tạo mới' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 0;
      width: 90%;
      max-width: 800px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .modal-header h2 {
      margin: 0;
      color: #2c3e50;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      color: #000;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #e9ecef;
    }

    .form-hint {
      font-size: 0.85rem;
      color: #6b7280;
      margin-top: 0.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #2c3e50;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 0;
      font-size: 1rem;
    }

    .form-control:focus {
      outline: none;
      border-color: #0d9488;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
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

    .tags-input {
      border: 1px solid #ddd;
      border-radius: 0;
      padding: 0.5rem;
      min-height: 50px;
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .tag {
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .tag-remove {
      background: none;
      border: none;
      color: #1976d2;
      cursor: pointer;
      font-weight: bold;
      padding: 0;
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .additional-questions,
    .tips-input {
      border: 1px solid #ddd;
      border-radius: 0;
      padding: 0.5rem;
    }

    .question-item,
    .tip-item {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      align-items: center;
    }

    .question-item input,
    .tip-item input {
      flex: 1;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-weight: normal;
    }

    .checkbox-label input[type="checkbox"] {
      margin-right: 0.5rem;
    }

    .image-upload-container {
      border: 2px dashed #ddd;
      border-radius: 0;
      padding: 1rem;
      background: #f9f9f9;
    }

    .image-input {
      margin-bottom: 1rem;
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ddd;
      border-radius: 0;
      cursor: pointer;
    }

    .image-preview {
      position: relative;
      margin-top: 1rem;
    }

    .preview-image {
      max-width: 100%;
      max-height: 300px;
      border-radius: 0;
      border: 1px solid #ddd;
      display: block;
      margin-bottom: 0.5rem;
    }

    .remove-image-btn {
      display: block;
      width: 100%;
      margin-top: 0.5rem;
    }

    .upload-hint {
      text-align: center;
      color: #6b7280;
      font-size: 0.875rem;
      padding: 0.5rem;
    }

    .image-source-hint {
      margin: 0 0 0.75rem 0;
      font-size: 0.875rem;
      color: #4b5563;
    }

    .sub-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.35rem;
    }

    .image-url-input {
      margin-bottom: 1rem;
    }

    @media (max-width: 768px) {
      .modal-content {
        width: 95%;
        margin: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .modal-footer {
        flex-direction: column;
      }
    }
  `]
})
export class WritingFormComponent implements OnInit, OnChanges {
  @Input() task: WritingTask | null = null;
  @Input() isVisible = false;
  @Output() save = new EventEmitter<WritingTask>();
  @Output() cancel = new EventEmitter<void>();

  private writingTaskApi = inject(WritingTaskApiService);
  task1TypeOptions = signal<WritingTaskTypeOptionDto[]>(FALLBACK_TASK1_TYPE_OPTIONS);
  task2TypeOptions = signal<WritingTaskTypeOptionDto[]>(FALLBACK_TASK2_TYPE_OPTIONS);

  typeOptionKebab(o: WritingTaskTypeOptionDto): string {
    return writingTaskTypeApiToKebab(o.code);
  }

  // Form data
  taskData: any = {
    type: 'task1',
    title: '',
    instruction: '',
    difficulty: 'medium',
    timeLimit: 20,
    wordCount: 150,
    source: undefined as string | undefined,
    isActive: true,
    tags: [],
    tips: [],
    sampleAnswer: '',
    writingGuide: '',
    task1Type: this.defaultTask1Kebab(),
    task2Type: this.defaultTask2Kebab(),
    description: '',
    question: '',
    additionalQuestions: [],
    data: {},
    imageUrl: ''
  };

  /** Text field for pasted HTTPS image URL (mutually exclusive with file → data URL in taskData.imageUrl) */
  imageLinkInput = '';

  isEditMode = computed(() => !!this.task);

  ngOnInit() {
    this.loadTypeCatalog();
    this.syncTaskToForm();
  }

  private defaultTask1Kebab(): string {
    return writingTaskTypeApiToKebab(this.task1TypeOptions()[0]?.code) || 'line-graph';
  }

  private defaultTask2Kebab(): string {
    return writingTaskTypeApiToKebab(this.task2TypeOptions()[0]?.code) || 'agree-disagree';
  }

  private loadTypeCatalog(): void {
    forkJoin({
      t1: this.writingTaskApi.getTask1Types().pipe(catchError(() => of([] as WritingTaskTypeOptionDto[]))),
      t2: this.writingTaskApi.getTask2Types().pipe(catchError(() => of([] as WritingTaskTypeOptionDto[])))
    }).subscribe(({ t1, t2 }) => {
      this.task1TypeOptions.set(t1?.length ? t1 : FALLBACK_TASK1_TYPE_OPTIONS);
      this.task2TypeOptions.set(t2?.length ? t2 : FALLBACK_TASK2_TYPE_OPTIONS);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['task'] || changes['isVisible']) {
      this.syncTaskToForm();
    }
  }

  private syncTaskToForm(): void {
    if (this.task) {
      // Edit mode - copy all task data including source
      this.taskData = { 
        ...this.task,
        source: this.task.source ?? undefined,
        tags: this.task.tags ? [...this.task.tags] : [],
        tips: this.task.tips ? [...this.task.tips] : [],
        additionalQuestions: this.task.type === 'task2' && this.task.additionalQuestions 
          ? [...this.task.additionalQuestions] 
          : []
      };
      const img = this.task.type === 'task1' ? (this.task as WritingTask1).imageUrl : '';
      if (img && typeof img === 'string' && /^https?:\/\//i.test(img.trim())) {
        this.imageLinkInput = img.trim();
      } else {
        this.imageLinkInput = '';
      }
    } else if (this.isVisible) {
      // Add mode - initialize with defaults
      this.resetFormData();
    }
  }

  resetFormData() {
    this.taskData = {
      type: 'task1',
      title: '',
      instruction: '', // Keep for backend compatibility
      difficulty: 'medium',
      timeLimit: 20,
      wordCount: 150,
      source: undefined as string | undefined,
      isActive: true,
      tags: [],
      tips: [],
      sampleAnswer: '',
      writingGuide: '',
      task1Type: this.defaultTask1Kebab(),
      task2Type: this.defaultTask2Kebab(),
      description: '',
      question: '',
      additionalQuestions: [],
      data: {},
      imageUrl: ''
    };
    this.imageLinkInput = '';
  }

  onTaskTypeChange() {
    if (this.taskData.type === 'task1') {
      // Switching to Task 1 - clear Task 2 fields
      this.taskData = {
        ...this.taskData,
        timeLimit: 20,
        wordCount: 150,
        task2Type: this.defaultTask2Kebab(),
        question: '',
        additionalQuestions: [],
        // Keep Task 1 fields
        task1Type: this.taskData.task1Type || this.defaultTask1Kebab(),
        description: this.taskData.description || '',
        data: this.taskData.data || {},
        imageUrl: this.taskData.imageUrl || ''
      };
    } else {
      // Switching to Task 2 - clear Task 1 fields including image
      this.taskData = {
        ...this.taskData,
        timeLimit: 40,
        wordCount: 250,
        task1Type: this.defaultTask1Kebab(),
        description: '',
        data: {},
        imageUrl: '', // Clear image when switching to Task 2
        // Keep Task 2 fields
        task2Type: this.taskData.task2Type || this.defaultTask2Kebab(),
        question: this.taskData.question || '',
        additionalQuestions: this.taskData.additionalQuestions || []
      };
      this.imageLinkInput = '';
    }
  }

  onImageLinkChange(value: string): void {
    const v = (value ?? '').trim();
    if (v && /^https?:\/\//i.test(v)) {
      this.taskData.imageUrl = v;
      const fileInput = document.getElementById('imageFileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } else if (!v) {
      const cur = this.taskData.imageUrl || '';
      if (cur.startsWith('http://') || cur.startsWith('https://')) {
        this.taskData.imageUrl = '';
      }
    }
  }

  addTag(tag: string) {
    if (tag.trim()) {
      this.taskData.tags = [...(this.taskData.tags || []), tag.trim()];
    }
  }

  removeTag(index: number) {
    this.taskData.tags?.splice(index, 1);
  }

  addQuestion() {
    this.taskData.additionalQuestions = [...(this.taskData.additionalQuestions || []), ''];
  }

  removeQuestion(index: number) {
    this.taskData.additionalQuestions?.splice(index, 1);
  }

  addTip() {
    this.taskData.tips = [...(this.taskData.tips || []), ''];
  }

  removeTip(index: number) {
    this.taskData.tips?.splice(index, 1);
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh (JPG, PNG, GIF)');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      
      this.imageLinkInput = '';
      // Convert to Base64
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.taskData.imageUrl = e.target.result;
      };
      reader.onerror = () => {
        alert('Lỗi khi đọc file ảnh');
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(): void {
    this.taskData.imageUrl = '';
    this.imageLinkInput = '';
    const fileInput = document.getElementById('imageFileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  private hasInstructionContent(): boolean {
    const instruction = this.taskData.instruction || '';
    const plainText = instruction
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
    return plainText.length > 0;
  }

  isFormValid(): boolean {
    const hasInstruction = this.hasInstructionContent();
    return !!(
      this.taskData.type &&
      this.taskData.title?.trim() &&
      hasInstruction &&
      this.taskData.difficulty &&
      this.taskData.timeLimit &&
      this.taskData.wordCount &&
      (this.taskData.type === 'task1' ? this.taskData.task1Type : this.taskData.task2Type) &&
      (this.taskData.type === 'task2' ? this.taskData.question?.trim() : true)
    );
  }

  onSubmit() {
    if (this.isFormValid()) {
      const task = { ...this.taskData } as WritingTask;
      task.source = this.taskData.source ?? undefined;
      if (this.isEditMode()) {
        task.id = this.task!.id;
        task.createdAt = this.task!.createdAt;
        task.updatedAt = this.task!.updatedAt;
      }
      this.save.emit(task);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}