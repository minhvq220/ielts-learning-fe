import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WritingTaskService } from '../../services/writing-task.service';
import { WritingFormComponent } from '../../components/writing-form/writing-form.component';
import { 
  WritingTask, 
  WritingTask1, 
  WritingTask2, 
  WritingTaskFilter,
  WritingTaskSort,
  Task1Type,
  Task2Type
} from '../../models/writing-task.model';

@Component({
  selector: 'app-writing-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, WritingFormComponent],
  template: `
    <div class="writing-admin-container">
      <!-- Header Section -->
      <div class="admin-header">
        <div class="header-content">
          <h1>Quản lý Bài Writing</h1>
          <div class="header-actions">
            <button class="btn btn-primary" (click)="openCreateModal()">
              <span class="icon">+</span>
              Thêm bài mới
            </button>
            <button class="btn btn-secondary" (click)="exportData()">
              <span class="icon">📥</span>
              Xuất dữ liệu
            </button>
            <button class="btn btn-secondary" (click)="openImportModal()">
              <span class="icon">📤</span>
              Nhập dữ liệu
            </button>
          </div>
        </div>
      </div>

      <!-- Statistics Dashboard (from API) -->
      <div class="stats-dashboard">
        <div class="stat-card">
          <div class="stat-icon">✎</div>
          <div class="stat-content">
            <h3>{{ adminStats()?.totalTasks ?? 0 }}</h3>
            <p>Tổng số bài</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">▣</div>
          <div class="stat-content">
            <h3>{{ adminStats()?.task1Count ?? 0 }}</h3>
            <p>Task 1</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✎</div>
          <div class="stat-content">
            <h3>{{ adminStats()?.task2Count ?? 0 }}</h3>
            <p>Task 2</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-content">
            <h3>{{ adminStats()?.byDifficulty?.hard ?? 0 }}</h3>
            <p>Bài khó</p>
          </div>
        </div>
      </div>

      <!-- Filters and Search -->
      <div class="filters-section">
        <div class="search-box">
          <input 
            type="text" 
            placeholder="Tìm kiếm bài viết..."
            [(ngModel)]="searchTerm"
            (input)="onSearchChange()">
          <span class="search-icon">⌕</span>
        </div>
        
        <div class="filter-controls">
          <select [(ngModel)]="selectedType" (change)="onFilterChange()">
            <option value="">Tất cả loại</option>
            <option value="task1">Task 1</option>
            <option value="task2">Task 2</option>
          </select>

          <select [(ngModel)]="selectedTask1Type" (change)="onFilterChange()" *ngIf="selectedType === 'task1'">
            <option value="">Tất cả dạng Task 1</option>
            <option value="line-graph">Line Graph</option>
            <option value="bar-chart">Bar Chart</option>
            <option value="pie-chart">Pie Chart</option>
            <option value="table">Table</option>
            <option value="mixed-graph">Mixed Graph</option>
            <option value="map">Map</option>
            <option value="process">Process</option>
          </select>

          <select [(ngModel)]="selectedTask2Type" (change)="onFilterChange()" *ngIf="selectedType === 'task2'">
            <option value="">Tất cả dạng Task 2</option>
            <option value="agree-disagree">Agree or Disagree</option>
            <option value="discussion">Discussion</option>
            <option value="advantages-disadvantages">Advantages and Disadvantages</option>
            <option value="causes-problems-solutions">Causes, Problems and Solutions</option>
            <option value="two-part-question">Two-Part Question</option>
            <option value="positive-negative-development">Positive or Negative Development</option>
          </select>

          <select [(ngModel)]="selectedDifficulty" (change)="onFilterChange()">
            <option value="">Tất cả độ khó</option>
            <option value="easy">Dễ</option>
            <option value="medium">Trung bình</option>
            <option value="hard">Khó</option>
          </select>

          <select [(ngModel)]="selectedSource" (change)="onFilterChange()">
            <option value="">Tất cả nguồn đề</option>
            <option value="CAMBRIDGE">Cambridge</option>
            <option value="VOL">VOL</option>
            <option value="ACTUAL_TESTS">Actual Tests</option>
            <option value="FORECAST">Forecast</option>
            <option value="OTHERS">Khác</option>
          </select>

          <input type="text" [(ngModel)]="selectedTag" (blur)="onFilterChange()" (keyup.enter)="onFilterChange()" placeholder="Lọc theo chủ đề..." class="filter-tag-input">

          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()">
            <option value="">Tất cả trạng thái</option>
            <option value="true">Đang hoạt động</option>
            <option value="false">Đã tắt</option>
          </select>

          <button class="btn btn-secondary" (click)="clearFilters()">
            Xóa bộ lọc
          </button>
        </div>
      </div>

      <!-- Tasks Table -->
      <div class="tasks-table-container">
        <div class="table-header">
          <h3>Danh sách bài viết ({{ totalElements() }} bài)</h3>
          <div class="sort-controls">
            <select [(ngModel)]="sortField" (change)="onSortChange()">
              <option value="createdAt">Ngày tạo</option>
              <option value="title">Tiêu đề</option>
              <option value="difficulty">Độ khó</option>
              <option value="updatedAt">Cập nhật</option>
            </select>
            <button class="btn btn-sm" (click)="toggleSortDirection()">
              {{ sortDirection === 'asc' ? '↑' : '↓' }}
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <div *ngIf="loading()" class="table-loading">Đang tải...</div>
          <table class="tasks-table" *ngIf="!loading()">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Loại</th>
                <th>Dạng đề</th>
                <th>Nguồn đề</th>
                <th>Độ khó</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let task of currentPageTasks()" class="task-row">
                <td class="task-title">
                  <div class="title-content">
                    <h4>{{ task.title }}</h4>
                    <p class="task-tags">
                      <span *ngFor="let tag of task.tags" class="tag">{{ tag }}</span>
                    </p>
                  </div>
                </td>
                <td>
                  <span class="task-type-badge" [class.task1]="task.type === 'task1'" [class.task2]="task.type === 'task2'">
                    {{ task.type === 'task1' ? 'Task 1' : 'Task 2' }}
                  </span>
                </td>
                <td>
                  <span class="task-subtype">
                    {{ getTaskSubtypeLabel(task) }}
                  </span>
                </td>
                <td>
                  <span class="source-badge" *ngIf="task.source">{{ getSourceLabel(task.source) }}</span>
                  <span class="source-empty" *ngIf="!task.source">—</span>
                </td>
                <td>
                  <span class="difficulty-badge" [class]="task.difficulty">
                    {{ getDifficultyLabel(task.difficulty) }}
                  </span>
                </td>
                <td>{{ task.timeLimit }} phút</td>
                <td>
                  <span class="status-badge" [class.active]="task.isActive" [class.inactive]="!task.isActive">
                    {{ task.isActive ? 'Hoạt động' : 'Tắt' }}
                  </span>
                </td>
                <td>{{ formatDate(task.createdAt) }}</td>
                <td class="actions">
                  <button class="btn btn-sm btn-primary" (click)="viewTask(task)">
                    👁️
                  </button>
                  <button class="btn btn-sm btn-secondary" (click)="editTask(task)">
                    ✏️
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteTask(task)">
                    🗑️
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Pagination -->
    <div class="pagination" *ngIf="totalPages() > 1">
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

      <!-- Writing Form Modal -->
      <app-writing-form 
        *ngIf="showModal()"
        [task]="selectedTask()"
        [isVisible]="showModal()"
        (save)="onSaveTask($event)"
        (cancel)="onCancelModal()">
      </app-writing-form>
    </div>
  `,
  styles: [`
    .writing-admin-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .admin-header {
      background: #0d9488;
      color: white;
      padding: 2rem;
      border-radius: 0;
      margin-bottom: 2rem;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .header-content h1 {
      margin: 0;
      font-size: 2rem;
    }

    .header-actions {
      display: flex;
      gap: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 0;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 0.5rem;
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

    .stats-dashboard {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: white;
      padding: 1.5rem;
      border-radius: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .stat-icon {
      font-size: 2rem;
      width: 60px;
      height: 60px;
      background: #f8f9fa;
      border-radius: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-content h3 {
      margin: 0;
      font-size: 2rem;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 0;
      color: #666;
      font-size: 0.9rem;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      margin-bottom: 2rem;
    }

    .search-box {
      position: relative;
      margin-bottom: 1rem;
    }

    .search-box input {
      width: 100%;
      padding: 0.75rem 1rem 0.75rem 3rem;
      border: 1px solid #ddd;
      border-radius: 0;
      font-size: 1rem;
    }

    .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: #666;
    }

    .filter-controls {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .filter-controls select,
    .filter-controls .filter-tag-input {
      padding: 0.5rem 0.6rem;
      border: 1px solid #ddd;
      border-radius: 0;
      min-width: 150px;
      height: 2.25rem;
      box-sizing: border-box;
      line-height: 1.25;
    }
    .filter-controls .filter-tag-input {
      min-width: 120px;
    }

    .tasks-table-container {
      background: white;
      border-radius: 0;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      overflow: hidden;
    }

    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #e9ecef;
    }

    .table-header h3 {
      margin: 0;
      color: #2c3e50;
    }

    .sort-controls {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .table-wrapper {
      overflow-x: auto;
    }

    .table-loading {
      padding: 2rem;
      text-align: center;
      color: #64748b;
    }

    .tasks-table {
      width: 100%;
      border-collapse: collapse;
    }

    .tasks-table th {
      background: #f8f9fa;
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 1px solid #e9ecef;
      font-size: 0.9rem;
    }

    .tasks-table td {
      padding: 1rem;
      border-bottom: 1px solid #e9ecef;
      vertical-align: top;
      font-size: 0.85rem;
    }

    .task-row:hover {
      background: #f8f9fa;
    }

    .task-title h4 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 0.95rem;
    }

    .task-tags {
      margin: 0;
    }

    .tag {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      font-size: 0.8rem;
      margin-right: 0.5rem;
    }

    .task-type-badge,
    .difficulty-badge,
    .status-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.2rem 0.6rem;
      border-radius: 0;
      font-size: 0.75rem;
      font-weight: 500;
      line-height: 1;
      white-space: nowrap;
      min-width: 82px;
    }

    .task-type-badge.task1 {
      background: #d4edda;
      color: #155724;
    }

    .task-type-badge.task2 {
      background: #f8d7da;
      color: #721c24;
    }

    .task-subtype {
      font-size: 0.9rem;
      color: #666;
    }

    .source-badge {
      font-size: 0.85rem;
      padding: 0.2rem 0.5rem;
      background: #e8eaf6;
      color: #3949ab;
      border-radius: 0;
    }

    .source-empty {
      color: #999;
      font-size: 0.9rem;
    }

    .difficulty-badge.easy {
      background: #d4edda;
      color: #155724;
    }

    .difficulty-badge.medium {
      background: #fff3cd;
      color: #856404;
    }

    .difficulty-badge.hard {
      background: #f8d7da;
      color: #721c24;
    }

    .status-badge.active {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.inactive {
      background: #f8d7da;
      color: #721c24;
    }

    .actions {
      display: flex;
      gap: 0.5rem;
    }

    .actions .btn {
      padding: 0.4rem 0.65rem;
      font-size: 0.75rem;
      min-width: 36px;
      justify-content: center;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .page-numbers {
      display: flex;
      gap: 0.5rem;
      align-items: center;
      flex-wrap: wrap;
    }

    .page-btn {
      min-width: 40px;
      background: #f1f3f5;
      color: #495057;
    }

    .page-btn.active {
      background: #0d9488;
      color: #fff;
      box-shadow: 0 2px 6px rgba(0, 123, 255, 0.3);
    }

    @media (max-width: 768px) {
      .writing-admin-container {
        padding: 1rem;
      }

      .header-content {
        flex-direction: column;
        gap: 1rem;
        text-align: center;
      }

      .filter-controls {
        flex-direction: column;
      }

      .filter-controls select {
        min-width: 100%;
      }

      .table-header {
        flex-direction: column;
        gap: 1rem;
      }

      .actions {
        flex-direction: column;
      }

      .page-numbers {
        justify-content: center;
      }
    }
  `]
})
export class WritingAdminComponent implements OnInit {
  private writingService = inject(WritingTaskService);

  readonly pageSize = 10;

  // Server-side: current page content and pagination info from API
  public loading = this.writingService.loading;
  public currentPageTasks = this.writingService.currentPageTasks;
  public totalElements = this.writingService.totalElements;
  public totalPages = this.writingService.totalPages;
  public currentPageNumber = this.writingService.currentPageNumber;
  public adminStats = this.writingService.adminStats;
  
  // Filter and search state (synced to service when applying)
  searchTerm = '';
  selectedType = '';
  selectedTask1Type = '';
  selectedTask2Type = '';
  selectedDifficulty = '';
  selectedSource = '';
  selectedTag = '';
  selectedStatus = '';
  sortField = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  // Modal state
  showModal = signal(false);
  selectedTask = signal<WritingTask | null>(null);

  /** 1-based current page for UI */
  currentPage = computed(() => this.currentPageNumber() + 1);

  ngOnInit(): void {
    this.applyFilterAndSort();
    this.writingService.loadTasks(0, this.pageSize);
    this.writingService.loadStatistics();
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  onFilterChange(): void {
    this.applyFilterAndSort();
  }

  onSortChange(): void {
    this.writingService.setSort({
      field: this.sortField as any,
      direction: this.sortDirection
    });
    this.writingService.loadTasks(0, this.pageSize);
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.onSortChange();
  }

  private applyFilterAndSort(): void {
    const filter: WritingTaskFilter = {};
    if (this.searchTerm) filter.search = this.searchTerm;
    if (this.selectedType) filter.type = this.selectedType as any;
    if (this.selectedTask1Type) filter.task1Type = this.selectedTask1Type as any;
    if (this.selectedTask2Type) filter.task2Type = this.selectedTask2Type as any;
    if (this.selectedDifficulty) filter.difficulty = this.selectedDifficulty as any;
    if (this.selectedSource) filter.source = this.selectedSource as any;
    if (this.selectedTag?.trim()) filter.tag = this.selectedTag.trim();
    if (this.selectedStatus !== '') filter.isActive = this.selectedStatus === 'true';
    this.writingService.setFilter(filter);
    this.writingService.setSort({ field: this.sortField as any, direction: this.sortDirection });
    this.writingService.loadTasks(0, this.pageSize);
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedTask1Type = '';
    this.selectedTask2Type = '';
    this.selectedDifficulty = '';
    this.selectedSource = '';
    this.selectedTag = '';
    this.selectedStatus = '';
    this.writingService.clearFilter();
    this.writingService.loadTasks(0, this.pageSize);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (total === 0) return;
    const target = Math.min(Math.max(page, 1), total);
    this.writingService.loadTasks(target - 1, this.pageSize);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    if (total <= 0) {
      return [];
    }
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  getTaskSubtypeLabel(task: WritingTask): string {
    if (task.type === 'task1') {
      const labels: Record<Task1Type, string> = {
        'line-graph': 'Line Graph',
        'bar-chart': 'Bar Chart',
        'pie-chart': 'Pie Chart',
        'table': 'Table',
        'mixed-graph': 'Mixed Graph',
        'map': 'Map',
        'process': 'Process'
      };
      return labels[task.task1Type];
    } else {
      const labels: Record<Task2Type, string> = {
        'agree-disagree': 'Agree/Disagree',
        'discussion': 'Discussion',
        'advantages-disadvantages': 'Advantages/Disadvantages',
        'causes-problems-solutions': 'Causes/Problems/Solutions',
        'two-part-question': 'Two-Part Question',
        'positive-negative-development': 'Positive/Negative Development'
      };
      return labels[task.task2Type];
    }
  }

  getDifficultyLabel(difficulty: string): string {
    const labels: Record<string, string> = {
      'easy': 'Dễ',
      'medium': 'Trung bình',
      'hard': 'Khó'
    };
    return labels[difficulty] || difficulty;
  }

  getSourceLabel(source: string | undefined): string {
    if (!source) return '';
    const labels: Record<string, string> = {
      'CAMBRIDGE': 'Cambridge',
      'VOL': 'VOL',
      'ACTUAL_TESTS': 'Actual Tests',
      'FORECAST': 'Forecast',
      'OTHERS': 'Others'
    };
    return labels[source] || source;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('vi-VN');
  }

  openCreateModal(): void {
    this.selectedTask.set(null);
    this.showModal.set(true);
  }

  viewTask(task: WritingTask): void {
    this.selectedTask.set(task);
    this.showModal.set(true);
  }

  editTask(task: WritingTask): void {
    this.selectedTask.set(task);
    this.showModal.set(true);
  }

  onSaveTask(task: WritingTask): void {
    if (this.selectedTask()) {
      // Update existing task
      const currentPage = this.writingService.currentPageNumber();
      this.writingService.updateTask(task.id, task).subscribe({
        next: () => {
          this.showModal.set(false);
          this.selectedTask.set(null);
          this.writingService.loadTasks(currentPage, this.pageSize);
          this.writingService.loadStatistics();
        },
        error: (error) => {
          console.error('Error updating task:', error);
          alert('Không thể cập nhật bài viết. Vui lòng thử lại.');
        }
      });
    } else {
      // Create new task
      this.writingService.createTask(task).subscribe({
        next: () => {
          this.showModal.set(false);
          this.selectedTask.set(null);
          this.writingService.loadTasks(0, this.pageSize);
          this.writingService.loadStatistics();
        },
        error: (error) => {
          console.error('Error creating task:', error);
          alert('Không thể tạo bài viết mới. Vui lòng thử lại.');
        }
      });
    }
  }

  onCancelModal(): void {
    this.showModal.set(false);
    this.selectedTask.set(null);
  }

  deleteTask(task: WritingTask): void {
    if (confirm(`Bạn có chắc muốn xóa bài "${task.title}"?`)) {
      const currentPage = this.writingService.currentPageNumber();
      this.writingService.deleteTask(task.id).subscribe({
        next: () => {
          this.writingService.loadTasks(currentPage, this.pageSize);
          this.writingService.loadStatistics();
        },
        error: (error) => {
          console.error('Error deleting task:', error);
          alert('Không thể xóa bài viết. Vui lòng thử lại.');
        }
      });
    }
  }

  exportData(): void {
    const data = this.writingService.exportTasks();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'writing-tasks.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  openImportModal(): void {
    // TODO: Implement import modal
    console.log('Open import modal');
  }
}
