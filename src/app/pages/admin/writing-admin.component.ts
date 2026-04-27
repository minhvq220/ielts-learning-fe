import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import {
  WritingTaskService,
  writingTaskTypeApiToKebab,
  formatTaskTypeKebabForDisplay
} from '../../services/writing-task.service';
import {
  WritingTaskApiService,
  WritingTaskTypeOptionDto,
  FALLBACK_TASK1_TYPE_OPTIONS,
  FALLBACK_TASK2_TYPE_OPTIONS
} from '../../services/writing-task-api.service';
import {
  downloadWritingTasksTemplate,
  parseWritingTasksExcel,
  WRITING_IMPORT_KEYS
} from '../../utils/writing-tasks-excel.util';
import { AppConfig } from '../../config/app.config';
import { WritingFormComponent } from '../../components/writing-form/writing-form.component';
import { 
  WritingTask, 
  WritingTask1, 
  WritingTask2, 
  WritingTaskFilter,
  WritingTaskSort
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
            <option *ngFor="let o of task1TypeFilterOptions()" [value]="typeOptionKebab(o)">{{ o.label }}</option>
          </select>

          <select [(ngModel)]="selectedTask2Type" (change)="onFilterChange()" *ngIf="selectedType === 'task2'">
            <option value="">Tất cả dạng Task 2</option>
            <option *ngFor="let o of task2TypeFilterOptions()" [value]="typeOptionKebab(o)">{{ o.label }}</option>
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

        <div class="bulk-bar" *ngIf="selectedBulkCount() > 0">
          <span class="bulk-bar-text">Đã chọn <strong>{{ selectedBulkCount() }}</strong> bài trên trang này</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-sm btn-primary" [disabled]="bulkBusy()" (click)="runBulkSetActive(true)">Bật (hiện trên site)</button>
            <button type="button" class="btn btn-sm btn-secondary" [disabled]="bulkBusy()" (click)="runBulkSetActive(false)">Tắt (ẩn khỏi site)</button>
            <button type="button" class="btn btn-sm btn-danger" [disabled]="bulkBusy()" (click)="runBulkDelete()">Xóa đã chọn</button>
            <button type="button" class="btn btn-sm btn-secondary" [disabled]="bulkBusy()" (click)="clearBulkSelection()">Bỏ chọn</button>
          </div>
        </div>
        <p *ngIf="bulkFeedback()" class="bulk-feedback" role="status">{{ bulkFeedback() }}</p>

        <div class="table-wrapper">
          <div *ngIf="loading()" class="table-loading">Đang tải...</div>
          <table class="tasks-table" *ngIf="!loading()">
            <thead>
              <tr>
                <th class="th-checkbox">
                  <input
                    type="checkbox"
                    [checked]="isAllOnPageSelected()"
                    (change)="onHeaderSelectAllChange($event)"
                    title="Chọn / bỏ chọn tất cả bài trên trang này"
                    aria-label="Chọn tất cả bài trên trang">
                </th>
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
                <td class="td-checkbox">
                  <input
                    type="checkbox"
                    [checked]="isTaskSelected(task.id)"
                    (change)="toggleTaskSelected(task.id, $event)"
                    [attr.aria-label]="'Chọn ' + task.title">
                </td>
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

      <!-- Import Excel modal -->
      <div class="import-modal-overlay" *ngIf="showImportModal()" (click)="closeImportModal()">
        <div class="import-modal" (click)="$event.stopPropagation()">
          <div class="import-modal-header">
            <h2>Nhập bài viết từ Excel</h2>
            <button type="button" class="import-close" (click)="closeImportModal()" aria-label="Đóng">×</button>
          </div>
          <div class="import-modal-body">
            <p class="import-intro">
              Sheet <strong>Bài viết</strong>: dòng 1 là mô tả tiếng Việt, dòng 2 là tên cột tiếng Anh (trùng API/DB),
              từ dòng 3 là dữ liệu. Xem sheet <strong>Chú thích</strong> trong file mẫu để biết giá trị cho phép.
            </p>
            <div class="import-url-suggest">
              <h3 class="import-url-suggest-title">Gợi ý từ URL (Engnovate)</h3>
              <p class="import-url-suggest-hint">
                Dán một hoặc nhiều URL (mỗi dòng một link, hoặc cách nhau bằng dấu phẩy / chấm phẩy). Host phải được phép trên server.
                Tối đa 25 URL mỗi lần. AI điền các cột giống nhập Excel — kiểm tra rồi sao chép TSV hoặc dùng Excel.
              </p>
              <div class="import-url-row import-url-row--stack">
                <textarea
                  class="import-url-textarea"
                  rows="4"
                  placeholder="https://engnovate.com/...&#10;https://engnovate.com/..."
                  [(ngModel)]="suggestSourceUrl"
                  [disabled]="suggestFromUrlLoading()"
                  name="suggestSourceUrl"></textarea>
                <button
                  type="button"
                  class="btn btn-primary btn-sm import-url-submit"
                  [disabled]="suggestFromUrlLoading() || !suggestSourceUrl.trim()"
                  (click)="runSuggestFromUrl()">
                  {{ suggestFromUrlLoading() ? 'Đang gọi AI…' : 'Lấy gợi ý' }}
                </button>
              </div>
              <p *ngIf="suggestFromUrlBatchNote()" class="import-url-batch-note">{{ suggestFromUrlBatchNote() }}</p>
              <p *ngIf="suggestFromUrlError()" class="import-error-banner">{{ suggestFromUrlError() }}</p>
              <div *ngIf="suggestBatchRows().length" class="suggest-batch-block">
                <p class="suggest-batch-summary">
                  <strong>Kết quả lô:</strong> {{ suggestBatchOkCount() }} thành công /
                  {{ suggestBatchRows().length }} URL
                  <span *ngIf="suggestBatchFailCount()"> ({{ suggestBatchFailCount() }} lỗi)</span>
                </p>
                <div class="suggest-batch-actions">
                  <button
                    type="button"
                    class="btn btn-secondary btn-sm"
                    [disabled]="!suggestBatchOkCount()"
                    (click)="copySuggestBatchAllTsv()">
                    Sao chép tất cả dòng TSV (các bài thành công)
                  </button>
                </div>
                <div class="suggest-batch-table-wrap">
                  <table class="suggest-batch-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>URL</th>
                        <th>Trạng thái</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr *ngFor="let row of suggestBatchRows(); let i = index">
                        <td>{{ i + 1 }}</td>
                        <td class="suggest-batch-url" [title]="row.sourceUrl">{{ row.sourceUrl }}</td>
                        <td>
                          <span *ngIf="!row.error" class="suggest-batch-ok">OK</span>
                          <span *ngIf="row.error" class="suggest-batch-err">{{ row.error }}</span>
                        </td>
                        <td class="suggest-batch-actions-cell">
                          <button
                            type="button"
                            class="btn btn-secondary btn-sm suggest-batch-mini"
                            *ngIf="!row.error"
                            (click)="copySuggestBatchRowTsv(i)">
                            TSV
                          </button>
                          <button
                            type="button"
                            class="btn btn-secondary btn-sm suggest-batch-mini"
                            *ngIf="!row.error"
                            (click)="loadSuggestBatchRowIntoEditor(i)">
                            Sửa
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div *ngIf="suggestFieldsReady()" class="suggest-fields-block">
                <div class="suggest-fields-actions">
                  <button type="button" class="btn btn-secondary btn-sm" (click)="copySuggestRowAsTsv()">Sao chép một dòng TSV</button>
                </div>
                <p
                  *ngIf="tsvCopyFeedback() as fb"
                  class="tsv-copy-feedback"
                  [class.tsv-copy-feedback--ok]="fb.ok"
                  [class.tsv-copy-feedback--err]="!fb.ok"
                  role="status"
                  aria-live="polite">
                  {{ fb.text }}
                </p>
                <div class="suggest-fields-scroll">
                  <div class="suggest-field-row" *ngFor="let key of importKeys">
                    <label [for]="'sf-' + key">{{ key }}</label>
                    <input [id]="'sf-' + key" type="text" [(ngModel)]="suggestFields[key]" [name]="'sf-' + key">
                  </div>
                </div>
              </div>
            </div>
            <div class="import-actions">
              <button type="button" class="btn btn-primary" (click)="downloadImportTemplate()">
                Tải file mẫu (.xlsx)
              </button>
            </div>
            <label class="import-file-label">
              <span>Chọn file Excel đã điền</span>
              <input
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                [disabled]="importing()"
                (change)="onImportExcelFile($event)">
            </label>
            <p *ngIf="importing()" class="import-status">Đang xử lý…</p>
            <p *ngIf="importBannerMessage()" class="import-error-banner">{{ importBannerMessage() }}</p>
            <div *ngIf="importSummary()" class="import-summary">
              <p><strong>Thành công:</strong> {{ importSummary()!.success }}</p>
              <div *ngIf="importSummary()!.failed.length">
                <strong>Lỗi ({{ importSummary()!.failed.length }}):</strong>
                <ul>
                  <li *ngFor="let f of importSummary()!.failed">Dòng {{ f.row }}: {{ f.msg }}</li>
                </ul>
              </div>
            </div>
          </div>
          <div class="import-modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeImportModal()">Đóng</button>
          </div>
        </div>
      </div>
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

    .bulk-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      margin: 0 1.5rem 0.75rem 1.5rem;
      padding: 0.65rem 1rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      font-size: 0.9rem;
    }

    .bulk-bar-text {
      color: #065f46;
    }

    .bulk-bar-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    .bulk-feedback {
      margin: 0 1.5rem 0.75rem 1.5rem;
      font-size: 0.85rem;
      color: #047857;
    }

    .th-checkbox,
    .td-checkbox {
      width: 44px;
      text-align: center;
      vertical-align: middle;
    }

    .th-checkbox input,
    .td-checkbox input {
      width: 1.1rem;
      height: 1.1rem;
      cursor: pointer;
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

    .import-modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.55);
      z-index: 1100;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
    }

    .import-modal {
      background: #fff;
      max-width: 560px;
      width: 100%;
      max-height: 90vh;
      overflow: auto;
      border-radius: 0;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
    }

    .import-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #e5e7eb;
      background: #0d9488;
      color: #fff;
    }

    .import-modal-header h2 {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 600;
    }

    .import-close {
      background: transparent;
      border: none;
      color: #fff;
      font-size: 1.75rem;
      line-height: 1;
      cursor: pointer;
      padding: 0 0.25rem;
    }

    .import-modal-body {
      padding: 1.25rem;
    }

    .import-intro {
      margin: 0 0 1rem 0;
      font-size: 0.9rem;
      color: #374151;
      line-height: 1.5;
    }

    .import-actions {
      margin-bottom: 1rem;
    }

    .import-file-label {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      color: #1f2937;
    }

    .import-file-label input[type="file"] {
      font-size: 0.85rem;
    }

    .import-status {
      margin: 0.75rem 0 0 0;
      color: #0d9488;
      font-weight: 500;
    }

    .import-error-banner {
      margin: 0.75rem 0 0 0;
      padding: 0.75rem;
      background: #fef2f2;
      color: #b91c1c;
      font-size: 0.875rem;
      white-space: pre-wrap;
    }

    .import-summary {
      margin-top: 1rem;
      padding: 0.75rem;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.875rem;
    }

    .import-summary ul {
      margin: 0.5rem 0 0 1rem;
      padding: 0;
    }

    .import-modal-footer {
      padding: 0.75rem 1.25rem;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: flex-end;
    }

    .import-url-suggest {
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .import-url-suggest-title {
      margin: 0 0 0.35rem 0;
      font-size: 1rem;
      font-weight: 600;
      color: #111827;
    }

    .import-url-suggest-hint {
      margin: 0 0 0.75rem 0;
      font-size: 0.85rem;
      color: #4b5563;
      line-height: 1.45;
    }

    .import-url-row {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
      align-items: flex-start;
    }

    .import-url-row--stack {
      flex-direction: column;
      align-items: stretch;
    }

    .import-url-textarea {
      width: 100%;
      min-height: 5.5rem;
      padding: 0.5rem 0.65rem;
      border: 1px solid #d1d5db;
      font-size: 0.85rem;
      font-family: inherit;
      line-height: 1.4;
      resize: vertical;
      box-sizing: border-box;
    }

    .import-url-submit {
      align-self: flex-start;
    }

    .import-url-batch-note {
      margin: 0.35rem 0 0 0;
      font-size: 0.8rem;
      color: #92400e;
    }

    .suggest-batch-block {
      margin-top: 0.75rem;
      padding: 0.5rem 0;
      border-top: 1px dashed #e5e7eb;
    }

    .suggest-batch-summary {
      margin: 0 0 0.5rem 0;
      font-size: 0.85rem;
      color: #374151;
    }

    .suggest-batch-actions {
      margin-bottom: 0.5rem;
    }

    .suggest-batch-table-wrap {
      max-height: 200px;
      overflow: auto;
      border: 1px solid #e5e7eb;
      background: #fff;
    }

    .suggest-batch-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.78rem;
    }

    .suggest-batch-table th,
    .suggest-batch-table td {
      padding: 0.35rem 0.45rem;
      border-bottom: 1px solid #f3f4f6;
      text-align: left;
      vertical-align: top;
    }

    .suggest-batch-table th {
      background: #f9fafb;
      font-weight: 600;
      color: #374151;
    }

    .suggest-batch-url {
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      word-break: break-all;
    }

    .suggest-batch-ok {
      color: #047857;
      font-weight: 600;
    }

    .suggest-batch-err {
      color: #b91c1c;
      display: block;
      max-width: 280px;
      white-space: normal;
      line-height: 1.35;
    }

    .suggest-batch-actions-cell {
      white-space: nowrap;
    }

    .suggest-batch-mini {
      padding: 0.15rem 0.4rem;
      font-size: 0.72rem;
      margin-right: 0.25rem;
    }

    .suggest-fields-block {
      margin-top: 0.75rem;
    }

    .suggest-fields-actions {
      margin-bottom: 0.5rem;
    }

    .tsv-copy-feedback {
      margin: 0.35rem 0 0 0;
      font-size: 0.85rem;
      font-weight: 500;
      line-height: 1.4;
    }

    .tsv-copy-feedback--ok {
      color: #047857;
    }

    .tsv-copy-feedback--err {
      color: #b91c1c;
    }

    .suggest-fields-scroll {
      max-height: 220px;
      overflow: auto;
      border: 1px solid #e5e7eb;
      padding: 0.5rem;
      background: #fafafa;
    }

    .suggest-field-row {
      display: grid;
      grid-template-columns: minmax(100px, 140px) 1fr;
      gap: 0.35rem 0.5rem;
      align-items: center;
      margin-bottom: 0.35rem;
      font-size: 0.8rem;
    }

    .suggest-field-row label {
      color: #374151;
      word-break: break-all;
    }

    .suggest-field-row input {
      width: 100%;
      padding: 0.35rem 0.45rem;
      border: 1px solid #d1d5db;
      font-size: 0.8rem;
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
export class WritingAdminComponent implements OnInit, OnDestroy {
  private writingService = inject(WritingTaskService);
  private writingTaskApi = inject(WritingTaskApiService);
  private http = inject(HttpClient);

  task1TypeFilterOptions = signal<WritingTaskTypeOptionDto[]>(FALLBACK_TASK1_TYPE_OPTIONS);
  task2TypeFilterOptions = signal<WritingTaskTypeOptionDto[]>(FALLBACK_TASK2_TYPE_OPTIONS);

  readonly pageSize = 10;
  readonly importKeys = [...WRITING_IMPORT_KEYS];

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

  showImportModal = signal(false);
  importing = signal(false);
  importBannerMessage = signal<string | null>(null);
  importSummary = signal<{ success: number; failed: { row: number; msg: string }[] } | null>(null);

  suggestSourceUrl = '';
  suggestFromUrlLoading = signal(false);
  suggestFromUrlError = signal<string | null>(null);
  suggestFromUrlBatchNote = signal<string | null>(null);
  /** Một dòng = một URL sau khi gọi API batch. */
  suggestBatchRows = signal<{ sourceUrl: string; fields: Record<string, string>; error: string | null }[]>([]);
  suggestBatchOkCount = computed(() => this.suggestBatchRows().filter(r => !r.error).length);
  suggestBatchFailCount = computed(() => this.suggestBatchRows().filter(r => !!r.error).length);
  suggestFieldsReady = signal(false);
  /** Editable copy of AI-suggested row (keys = WRITING_IMPORT_KEYS) */
  suggestFields: Record<string, string> = {};

  private readonly maxSuggestUrls = 25;

  /** User feedback after TSV copy (auto-clears). */
  tsvCopyFeedback = signal<{ text: string; ok: boolean } | null>(null);
  private tsvCopyFeedbackTimer: ReturnType<typeof setTimeout> | null = null;

  /** 1-based current page for UI */
  currentPage = computed(() => this.currentPageNumber() + 1);

  /** Checkbox chọn nhiều bài (theo id string, chỉ trang hiện tại). */
  selectedTaskIds = signal<Set<string>>(new Set());
  bulkBusy = signal(false);
  bulkFeedback = signal<string | null>(null);
  selectedBulkCount = computed(() => this.selectedTaskIds().size);

  ngOnInit(): void {
    this.loadTypeCatalog();
    this.applyFilterAndSort();
    this.writingService.loadTasks(0, this.pageSize);
    this.writingService.loadStatistics();
  }

  typeOptionKebab(o: WritingTaskTypeOptionDto): string {
    return writingTaskTypeApiToKebab(o.code);
  }

  private loadTypeCatalog(): void {
    forkJoin({
      t1: this.writingTaskApi.getTask1Types().pipe(catchError(() => of([] as WritingTaskTypeOptionDto[]))),
      t2: this.writingTaskApi.getTask2Types().pipe(catchError(() => of([] as WritingTaskTypeOptionDto[])))
    }).subscribe(({ t1, t2 }) => {
      this.task1TypeFilterOptions.set(t1?.length ? t1 : FALLBACK_TASK1_TYPE_OPTIONS);
      this.task2TypeFilterOptions.set(t2?.length ? t2 : FALLBACK_TASK2_TYPE_OPTIONS);
    });
  }

  ngOnDestroy(): void {
    this.clearTsvCopyFeedbackTimer();
  }

  onSearchChange(): void {
    this.applyFilterAndSort();
  }

  onFilterChange(): void {
    this.applyFilterAndSort();
  }

  onSortChange(): void {
    this.clearBulkSelection();
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
    this.clearBulkSelection();
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
    this.clearBulkSelection();
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
    this.clearBulkSelection();
    const total = this.totalPages();
    if (total === 0) return;
    const target = Math.min(Math.max(page, 1), total);
    this.writingService.loadTasks(target - 1, this.pageSize);
  }

  clearBulkSelection(clearMessage = true): void {
    this.selectedTaskIds.set(new Set());
    if (clearMessage) {
      this.bulkFeedback.set(null);
    }
  }

  isTaskSelected(taskId: string): boolean {
    return this.selectedTaskIds().has(taskId);
  }

  isAllOnPageSelected(): boolean {
    const tasks = this.currentPageTasks();
    if (tasks.length === 0) return false;
    const sel = this.selectedTaskIds();
    return tasks.every(t => sel.has(t.id));
  }

  onHeaderSelectAllChange(ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const tasks = this.currentPageTasks();
    const next = new Set(this.selectedTaskIds());
    if (checked) {
      tasks.forEach(t => next.add(t.id));
    } else {
      tasks.forEach(t => next.delete(t.id));
    }
    this.selectedTaskIds.set(next);
    this.bulkFeedback.set(null);
  }

  toggleTaskSelected(taskId: string, ev: Event): void {
    const checked = (ev.target as HTMLInputElement).checked;
    const next = new Set(this.selectedTaskIds());
    if (checked) {
      next.add(taskId);
    } else {
      next.delete(taskId);
    }
    this.selectedTaskIds.set(next);
    this.bulkFeedback.set(null);
  }

  async runBulkSetActive(isActive: boolean): Promise<void> {
    const ids = Array.from(this.selectedTaskIds());
    if (ids.length === 0) return;
    this.bulkBusy.set(true);
    this.bulkFeedback.set(null);
    try {
      const res = await firstValueFrom(this.writingService.bulkSetActive(ids, isActive));
      this.clearBulkSelection(false);
      this.bulkFeedback.set(`Đã cập nhật ${res.updated} bài (${isActive ? 'bật' : 'tắt'}).`);
      this.writingService.loadTasks(this.writingService.currentPageNumber(), this.pageSize);
      this.writingService.loadStatistics();
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'error' in err ? (err as { error?: { message?: string } }).error : undefined;
      const msg = typeof body?.message === 'string' ? body.message : 'Không cập nhật được. Thử lại sau.';
      this.bulkFeedback.set(msg);
    } finally {
      this.bulkBusy.set(false);
    }
  }

  async runBulkDelete(): Promise<void> {
    const ids = Array.from(this.selectedTaskIds());
    if (ids.length === 0) return;
    const ok = confirm(
      `Xóa vĩnh viễn ${ids.length} bài đã chọn? Hành động này không hoàn tác.\n` +
        '(Nếu còn lịch sử làm bài gắn với các đề này, server có thể từ chối xóa.)'
    );
    if (!ok) return;
    this.bulkBusy.set(true);
    this.bulkFeedback.set(null);
    try {
      const res = await firstValueFrom(this.writingService.bulkDelete(ids));
      this.clearBulkSelection(false);
      this.bulkFeedback.set(`Đã xóa ${res.deleted} bài.`);
      this.writingService.loadTasks(this.writingService.currentPageNumber(), this.pageSize);
      this.writingService.loadStatistics();
    } catch (err: unknown) {
      const body = err && typeof err === 'object' && 'error' in err ? (err as { error?: { message?: string } }).error : undefined;
      const msg = typeof body?.message === 'string' ? body.message : 'Không xóa được (kiểm tra ràng buộc dữ liệu hoặc thử lại).';
      this.bulkFeedback.set(msg);
    } finally {
      this.bulkBusy.set(false);
    }
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
      const labels: Record<string, string> = {
        'line-graph': 'Line Graph',
        'bar-chart': 'Bar Chart',
        'pie-chart': 'Pie Chart',
        'table': 'Table',
        'mixed-graph': 'Mixed Graph',
        'map': 'Map',
        'process': 'Process'
      };
      return labels[task.task1Type] ?? formatTaskTypeKebabForDisplay(task.task1Type);
    }
    const labels: Record<string, string> = {
      'agree-disagree': 'Agree/Disagree',
      'discussion': 'Discussion',
      'advantages-disadvantages': 'Advantages/Disadvantages',
      'causes-problems-solutions': 'Causes/Problems/Solutions',
      'two-part-question': 'Two-Part Question',
      'positive-negative-development': 'Positive/Negative Development'
    };
    return labels[(task as WritingTask2).task2Type] ?? formatTaskTypeKebabForDisplay((task as WritingTask2).task2Type);
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
    this.importBannerMessage.set(null);
    this.importSummary.set(null);
    this.resetSuggestFromUrl();
    this.showImportModal.set(true);
  }

  closeImportModal(): void {
    this.clearTsvCopyFeedback();
    this.showImportModal.set(false);
  }

  private clearTsvCopyFeedbackTimer(): void {
    if (this.tsvCopyFeedbackTimer != null) {
      clearTimeout(this.tsvCopyFeedbackTimer);
      this.tsvCopyFeedbackTimer = null;
    }
  }

  private clearTsvCopyFeedback(): void {
    this.clearTsvCopyFeedbackTimer();
    this.tsvCopyFeedback.set(null);
  }

  private resetSuggestFromUrl(): void {
    this.clearTsvCopyFeedback();
    this.suggestSourceUrl = '';
    this.suggestFromUrlLoading.set(false);
    this.suggestFromUrlError.set(null);
    this.suggestFromUrlBatchNote.set(null);
    this.suggestBatchRows.set([]);
    this.suggestFieldsReady.set(false);
    this.suggestFields = {};
  }

  /** Tách URL từ nhiều dòng hoặc phẩy / chấm phẩy; giữ thứ tự, bỏ trùng. */
  private parseSourceUrls(text: string): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const rawLine of text.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line) continue;
      for (const segment of line.split(/[,;]\s*/)) {
        const u = segment.trim();
        if (!u || seen.has(u)) continue;
        seen.add(u);
        out.push(u);
      }
    }
    return out;
  }

  private normalizeSuggestFields(fields: Record<string, string> | null | undefined): Record<string, string> {
    const row: Record<string, string> = {};
    for (const k of WRITING_IMPORT_KEYS) {
      row[k] = (fields && fields[k] != null ? String(fields[k]) : '').trim();
    }
    return row;
  }

  runSuggestFromUrl(): void {
    let urls = this.parseSourceUrls(this.suggestSourceUrl);
    if (!urls.length) {
      this.suggestFromUrlError.set('Chưa có URL hợp lệ. Dán link https (mỗi dòng hoặc cách nhau bằng dấu phẩy).');
      return;
    }
    this.suggestFromUrlBatchNote.set(null);
    if (urls.length > this.maxSuggestUrls) {
      this.suggestFromUrlBatchNote.set(`Chỉ xử lý ${this.maxSuggestUrls} URL đầu tiên (giới hạn mỗi lần).`);
      urls = urls.slice(0, this.maxSuggestUrls);
    }
    this.suggestFromUrlLoading.set(true);
    this.suggestFromUrlError.set(null);
    this.suggestBatchRows.set([]);
    const endpoint = `${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/admin/writing-import/suggest-from-urls`;
    this.http
      .post<{ items: { sourceUrl: string; fields: Record<string, string>; error: string | null }[] }>(endpoint, {
        urls
      })
      .subscribe({
        next: res => {
          const items = Array.isArray(res?.items) ? res.items : [];
          const rows = items.map(it => ({
            sourceUrl: (it.sourceUrl ?? '').trim(),
            fields: this.normalizeSuggestFields(it.fields),
            error: it.error != null && String(it.error).trim() !== '' ? String(it.error).trim() : null
          }));
          this.suggestBatchRows.set(rows);
          const firstOk = rows.findIndex(r => !r.error);
          if (firstOk >= 0) {
            this.loadSuggestBatchRowIntoEditor(firstOk);
          } else {
            this.suggestFields = {};
            this.suggestFieldsReady.set(false);
          }
          this.suggestFromUrlLoading.set(false);
        },
        error: err => {
          const body = err?.error;
          const msg =
            typeof body?.message === 'string'
              ? body.message
              : typeof body === 'string'
                ? body
                : err?.message ?? 'Không lấy được gợi ý.';
          this.suggestFromUrlError.set(msg);
          this.suggestBatchRows.set([]);
          this.suggestFieldsReady.set(false);
          this.suggestFromUrlLoading.set(false);
        }
      });
  }

  loadSuggestBatchRowIntoEditor(index: number): void {
    const row = this.suggestBatchRows()[index];
    if (!row || row.error) return;
    this.suggestFields = { ...row.fields };
    this.suggestFieldsReady.set(true);
  }

  copySuggestBatchRowTsv(index: number): void {
    const row = this.suggestBatchRows()[index];
    if (!row || row.error) return;
    const parts = WRITING_IMPORT_KEYS.map(k => this.tsvCell(row.fields[k] ?? ''));
    const line = parts.join('\t');
    this.clearTsvCopyFeedbackTimer();
    void navigator.clipboard.writeText(line).then(
      () => {
        this.tsvCopyFeedback.set({
          ok: true,
          text: 'Đã sao chép một dòng TSV cho bài đã chọn.'
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 3500);
      },
      () => {
        this.tsvCopyFeedback.set({
          ok: false,
          text: 'Chưa sao chép được — thử lại trên HTTPS hoặc cấp quyền clipboard.'
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 5000);
      }
    );
  }

  copySuggestBatchAllTsv(): void {
    const okRows = this.suggestBatchRows().filter(r => !r.error);
    if (!okRows.length) return;
    const lines = okRows.map(row =>
      WRITING_IMPORT_KEYS.map(k => this.tsvCell(row.fields[k] ?? '')).join('\t')
    );
    const text = lines.join('\n');
    this.clearTsvCopyFeedbackTimer();
    void navigator.clipboard.writeText(text).then(
      () => {
        this.tsvCopyFeedback.set({
          ok: true,
          text: `Đã sao chép ${okRows.length} dòng TSV — dán vào Excel (sheet «Bài viết», từ dòng trống tiếp theo).`
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 4500);
      },
      () => {
        this.tsvCopyFeedback.set({
          ok: false,
          text: 'Chưa sao chép được — thử lại trên HTTPS hoặc cấp quyền clipboard.'
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 5000);
      }
    );
  }

  private tsvCell(value: string): string {
    return (value ?? '').replace(/\r\n|\r|\n|\t/g, ' ').trim();
  }

  copySuggestRowAsTsv(): void {
    const parts = WRITING_IMPORT_KEYS.map(k => this.tsvCell(this.suggestFields[k] ?? ''));
    const line = parts.join('\t');
    this.clearTsvCopyFeedbackTimer();
    void navigator.clipboard.writeText(line).then(
      () => {
        this.tsvCopyFeedback.set({
          ok: true,
          text: 'Đã sao chép — dán vào Excel trên sheet «Bài viết» (một dòng, đúng thứ tự cột dòng 2).'
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 4000);
      },
      () => {
        this.tsvCopyFeedback.set({
          ok: false,
          text: 'Chưa sao chép được — thử lại trên HTTPS hoặc cấp quyền clipboard cho trang này.'
        });
        this.tsvCopyFeedbackTimer = setTimeout(() => {
          this.tsvCopyFeedback.set(null);
          this.tsvCopyFeedbackTimer = null;
        }, 6000);
      }
    );
  }

  async downloadImportTemplate(): Promise<void> {
    await downloadWritingTasksTemplate();
  }

  async onImportExcelFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.importing.set(true);
    this.importBannerMessage.set(null);
    this.importSummary.set(null);

    try {
      const results = await parseWritingTasksExcel(file);
      const global = results.find(r => r.excelRow === 0 && r.parseError);
      if (global?.parseError) {
        this.importBannerMessage.set(global.parseError);
        return;
      }

      const failed: { row: number; msg: string }[] = [];
      let success = 0;

      for (const r of results) {
        if (r.parseError && !r.task) {
          failed.push({ row: r.excelRow, msg: r.parseError });
          continue;
        }
        if (!r.task) continue;
        try {
          await firstValueFrom(this.writingService.createTask(r.task));
          success++;
        } catch (err: unknown) {
          const msg =
            err && typeof err === 'object' && 'error' in err
              ? JSON.stringify((err as { error?: unknown }).error)
              : err instanceof Error
                ? err.message
                : 'Lỗi khi tạo bài trên server';
          failed.push({ row: r.excelRow, msg: String(msg) });
        }
      }

      this.importSummary.set({ success, failed });

      if (success > 0) {
        this.writingService.loadTasks(this.writingService.currentPageNumber(), this.pageSize);
        this.writingService.loadStatistics();
      }
    } catch {
      this.importBannerMessage.set('Không đọc được file Excel. Kiểm tra định dạng .xlsx / .xls.');
    } finally {
      this.importing.set(false);
      input.value = '';
    }
  }
}
