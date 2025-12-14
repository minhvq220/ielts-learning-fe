import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';

interface UserDto {
  id: number;
  firebaseUid: string;
  email: string;
  name: string;
  pictureUrl?: string;
  role: 'USER' | 'ADMIN';
  enabled: boolean;
  createdAt: string;
  updatedAt?: string;
  lastLoginAt?: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: 'USER' | 'ADMIN';
  enabled?: boolean;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container">
      <div class="users-header">
        <h2>Quản lý người dùng</h2>
        <p>Quản lý tài khoản người dùng, khóa/mở khóa tài khoản</p>
      </div>

      <div class="filters-section">
        <div class="filter-group search-group">
          <label>🔍 Tìm kiếm:</label>
          <div class="search-input-wrapper">
            <input 
              type="text" 
              [(ngModel)]="searchQuery" 
              (keyup.enter)="loadUsers()"
              placeholder="Tìm theo email hoặc tên..."
              class="search-input">
            <button class="btn btn-primary btn-search" (click)="loadUsers()" type="button">
              🔍 Tìm kiếm
            </button>
          </div>
        </div>
      </div>

      <div class="users-list">
        <div *ngIf="loading()" class="loading">
          <div class="spinner"></div>
          <p>Đang tải danh sách người dùng...</p>
        </div>

        <div *ngIf="!loading() && usersPage() && usersPage()!.content.length === 0" class="empty-state">
          <div class="empty-icon">👥</div>
          <h3>Không tìm thấy người dùng nào</h3>
          <p *ngIf="searchQuery">Không có kết quả phù hợp với từ khóa tìm kiếm.</p>
          <p *ngIf="!searchQuery">Chưa có người dùng nào.</p>
        </div>

        <div *ngIf="!loading() && usersPage() && usersPage()!.content.length > 0" class="users-table-wrapper">
          <table class="users-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Tên</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Đăng nhập cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of usersPage()?.content || []" 
                  [class.disabled]="!user.enabled">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>{{ user.name }}</td>
                <td>
                  <span class="role-badge" [class.admin]="user.role === 'ADMIN'">
                    {{ user.role === 'ADMIN' ? 'Admin' : 'User' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" [class.enabled]="user.enabled" [class.disabled]="!user.enabled">
                    {{ user.enabled ? 'Hoạt động' : 'Đã khóa' }}
                  </span>
                </td>
                <td>{{ formatDate(user.createdAt) }}</td>
                <td>{{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Chưa đăng nhập' }}</td>
                <td class="actions">
                  <button 
                    class="btn btn-sm btn-edit" 
                    (click)="openEditModal(user)"
                    title="Sửa thông tin">
                    ✏️ Sửa
                  </button>
                  <button 
                    *ngIf="user.enabled"
                    class="btn btn-sm btn-lock" 
                    (click)="lockUser(user.id)"
                    title="Khóa tài khoản">
                    🔒 Khóa
                  </button>
                  <button 
                    *ngIf="!user.enabled"
                    class="btn btn-sm btn-unlock" 
                    (click)="unlockUser(user.id)"
                    title="Mở khóa tài khoản">
                    🔓 Mở khóa
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="!loading() && usersPage() && usersPage()!.totalPages > 1" class="pagination">
          <button 
            class="btn btn-secondary" 
            [disabled]="currentPage() === 0"
            (click)="goToPage(currentPage() - 1)">
            ← Trước
          </button>
          <span class="page-info">
            Trang {{ currentPage() + 1 }} / {{ usersPage()!.totalPages }} 
            (Tổng: {{ usersPage()!.totalElements }} người dùng)
          </span>
          <button 
            class="btn btn-secondary" 
            [disabled]="currentPage() >= (usersPage()!.totalPages - 1)"
            (click)="goToPage(currentPage() + 1)">
            Sau →
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Modal -->
    <div *ngIf="showEditModal()" class="modal-overlay" (click)="closeEditModal()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Sửa thông tin người dùng</h3>
          <button class="modal-close" (click)="closeEditModal()">×</button>
        </div>
        <div class="modal-body">
          <div *ngIf="editingUser()">
            <div class="form-group">
              <label>Email:</label>
              <input type="email" [(ngModel)]="editForm.email" class="form-control">
            </div>
            <div class="form-group">
              <label>Tên:</label>
              <input type="text" [(ngModel)]="editForm.name" class="form-control">
            </div>
            <div class="form-group">
              <label>Vai trò:</label>
              <select [(ngModel)]="editForm.role" class="form-control">
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" [(ngModel)]="editForm.enabled">
                Tài khoản hoạt động
              </label>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" (click)="closeEditModal()">Hủy</button>
          <button class="btn btn-primary" (click)="saveUser()" [disabled]="saving()">
            {{ saving() ? 'Đang lưu...' : 'Lưu' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      max-width: 1400px;
      margin: 0 auto;
      padding: 2rem;
    }

    .users-header {
      margin-bottom: 2rem;
    }

    .users-header h2 {
      margin: 0 0 0.5rem 0;
      color: #333;
    }

    .users-header p {
      color: #666;
      margin: 0;
    }

    .filters-section {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      margin-bottom: 2rem;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .filter-group {
      margin-bottom: 1rem;
    }

    .filter-group:last-child {
      margin-bottom: 0;
    }

    .filter-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .search-input-wrapper {
      display: flex;
      gap: 0.5rem;
    }

    .search-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #5568d3;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #5a6268;
    }

    .btn-sm {
      padding: 0.5rem 1rem;
      font-size: 0.875rem;
    }

    .btn-edit {
      background: #17a2b8;
      color: white;
      margin-right: 0.5rem;
    }

    .btn-lock {
      background: #dc3545;
      color: white;
    }

    .btn-unlock {
      background: #28a745;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .loading {
      text-align: center;
      padding: 3rem;
    }

    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .users-table-wrapper {
      overflow-x: auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .users-table {
      width: 100%;
      border-collapse: collapse;
    }

    .users-table thead {
      background: #f8f9fa;
    }

    .users-table th {
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: #333;
      border-bottom: 2px solid #dee2e6;
    }

    .users-table td {
      padding: 1rem;
      border-bottom: 1px solid #dee2e6;
    }

    .users-table tbody tr:hover {
      background: #f8f9fa;
    }

    .users-table tbody tr.disabled {
      opacity: 0.6;
      background: #f8f9fa;
    }

    .role-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      background: #e9ecef;
      color: #495057;
    }

    .role-badge.admin {
      background: #667eea;
      color: white;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
    }

    .status-badge.enabled {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.disabled {
      background: #f8d7da;
      color: #721c24;
    }

    .actions {
      white-space: nowrap;
    }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      margin-top: 2rem;
      padding: 1rem;
    }

    .page-info {
      color: #666;
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal-content {
      background: white;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid #dee2e6;
    }

    .modal-header h3 {
      margin: 0;
    }

    .modal-close {
      background: none;
      border: none;
      font-size: 2rem;
      cursor: pointer;
      color: #666;
      line-height: 1;
    }

    .modal-body {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #333;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 1rem;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      padding: 1.5rem;
      border-top: 1px solid #dee2e6;
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8081/api/admin/users';

  loading = signal(false);
  usersPage = signal<Page<UserDto> | null>(null);
  currentPage = signal(0);
  searchQuery = '';
  showEditModal = signal(false);
  editingUser = signal<UserDto | null>(null);
  saving = signal(false);

  editForm: UpdateUserRequest = {
    name: '',
    email: '',
    role: 'USER',
    enabled: true
  };

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading.set(true);
    const params = new HttpParams()
      .set('page', this.currentPage().toString())
      .set('size', '20')
      .set('search', this.searchQuery || '');

    this.http.get<Page<UserDto>>(this.apiUrl, { params }).subscribe({
      next: (page) => {
        this.usersPage.set(page);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading users:', err);
        alert('Không thể tải danh sách người dùng. Vui lòng thử lại sau.');
        this.loading.set(false);
      }
    });
  }

  goToPage(page: number) {
    this.currentPage.set(page);
    this.loadUsers();
  }

  openEditModal(user: UserDto) {
    this.editingUser.set(user);
    this.editForm = {
      name: user.name,
      email: user.email,
      role: user.role,
      enabled: user.enabled
    };
    this.showEditModal.set(true);
  }

  closeEditModal() {
    this.showEditModal.set(false);
    this.editingUser.set(null);
  }

  saveUser() {
    const user = this.editingUser();
    if (!user) return;

    this.saving.set(true);
    this.http.put<UserDto>(`${this.apiUrl}/${user.id}`, this.editForm).subscribe({
      next: () => {
        alert('Cập nhật thông tin người dùng thành công!');
        this.closeEditModal();
        this.loadUsers();
        this.saving.set(false);
      },
      error: (err) => {
        console.error('Error updating user:', err);
        const errorMsg = err.error?.message || 'Không thể cập nhật thông tin người dùng. Vui lòng thử lại sau.';
        alert(errorMsg);
        this.saving.set(false);
      }
    });
  }

  lockUser(userId: number) {
    if (!confirm('Bạn có chắc chắn muốn khóa tài khoản này? Người dùng sẽ không thể đăng nhập và sử dụng hệ thống.')) {
      return;
    }

    this.http.put<UserDto>(`${this.apiUrl}/${userId}/lock`, {}).subscribe({
      next: () => {
        alert('Đã khóa tài khoản thành công!');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error locking user:', err);
        const errorMsg = err.error?.message || 'Không thể khóa tài khoản. Vui lòng thử lại sau.';
        alert(errorMsg);
      }
    });
  }

  unlockUser(userId: number) {
    if (!confirm('Bạn có chắc chắn muốn mở khóa tài khoản này?')) {
      return;
    }

    this.http.put<UserDto>(`${this.apiUrl}/${userId}/unlock`, {}).subscribe({
      next: () => {
        alert('Đã mở khóa tài khoản thành công!');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error unlocking user:', err);
        const errorMsg = err.error?.message || 'Không thể mở khóa tài khoản. Vui lòng thử lại sau.';
        alert(errorMsg);
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

