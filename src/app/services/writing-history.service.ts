import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, map } from 'rxjs';
import { WritingHistoryApiService, WritingHistoryDto, SubmitWritingDto, UserWritingStatsDto } from './writing-history-api.service';

@Injectable({
  providedIn: 'root'
})
export class WritingHistoryService {
  private apiService = inject(WritingHistoryApiService);
  
  // Current user ID (in real app, this would come from auth service)
  private currentUserId = signal<string>('user123'); // Default user ID
  
  // State management
  private _history = signal<WritingHistoryDto[]>([]);
  private _completedTaskIds = signal<number[]>([]);
  private _uncompletedTaskIds = signal<number[]>([]);
  private _userStats = signal<UserWritingStatsDto | null>(null);
  private _loading = signal(false);
  private _error = signal<string | null>(null);

  // Public signals
  public history = computed(() => this._history());
  public completedTaskIds = computed(() => this._completedTaskIds());
  public uncompletedTaskIds = computed(() => this._uncompletedTaskIds());
  public userStats = computed(() => this._userStats());
  public loading = computed(() => this._loading());
  public error = computed(() => this._error());

  // Computed values
  public completedTasks = computed(() => {
    return this._history().filter(h => h.taskId);
  });

  public task1History = computed(() => {
    return this._history().filter(h => h.taskType === 'TASK1');
  });

  public task2History = computed(() => {
    return this._history().filter(h => h.taskType === 'TASK2');
  });

  public recentHistory = computed(() => {
    return this._history()
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
      .slice(0, 5);
  });

  constructor() {
    this.loadUserData();
  }

  // Set current user ID
  setCurrentUserId(userId: string): void {
    this.currentUserId.set(userId);
    this.loadUserData();
  }

  // Load all user data
  loadUserData(): void {
    const userId = this.currentUserId();
    if (!userId) return;

    this._loading.set(true);
    this._error.set(null);

    // Load history, completed tasks, and stats in parallel
    Promise.all([
      this.apiService.getUserHistory(userId).toPromise(),
      this.apiService.getCompletedTaskIds(userId).toPromise(),
      this.apiService.getUncompletedTaskIds(userId).toPromise(),
      this.apiService.getUserStats(userId).toPromise()
    ]).then(([history, completedIds, uncompletedIds, stats]) => {
      this._history.set(history || []);
      this._completedTaskIds.set(completedIds || []);
      this._uncompletedTaskIds.set(uncompletedIds || []);
      this._userStats.set(stats || null);
      this._loading.set(false);
    }).catch(error => {
      console.error('Error loading user data:', error);
      this._error.set('Không thể tải dữ liệu người dùng');
      this._loading.set(false);
    });
  }

  // Submit bài làm
  submitWriting(submitDto: Omit<SubmitWritingDto, 'userId'>): Observable<WritingHistoryDto> {
    this._loading.set(true);
    this._error.set(null);

    const fullSubmitDto: SubmitWritingDto = {
      ...submitDto,
      userId: this.currentUserId()
    };

    return this.apiService.submitWriting(fullSubmitDto).pipe(
      tap(result => {
        // Add to local history
        const currentHistory = this._history();
        this._history.set([result, ...currentHistory]);
        
        // Update completed task IDs
        const completedIds = this._completedTaskIds();
        if (!completedIds.includes(result.taskId)) {
          this._completedTaskIds.set([...completedIds, result.taskId]);
        }
        
        // Remove from uncompleted if exists
        const uncompletedIds = this._uncompletedTaskIds();
        this._uncompletedTaskIds.set(uncompletedIds.filter(id => id !== result.taskId));
        
        // Reload stats
        this.loadUserStats();
        
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error submitting writing:', error);
        this._error.set('Không thể nộp bài viết');
        this._loading.set(false);
        throw error;
      })
    );
  }

  // Load user stats
  loadUserStats(): void {
    const userId = this.currentUserId();
    if (!userId) return;

    this.apiService.getUserStats(userId).pipe(
      tap(stats => {
        this._userStats.set(stats);
      }),
      catchError(error => {
        console.error('Error loading user stats:', error);
        return of(null);
      })
    ).subscribe();
  }

  // Check if task is completed
  isTaskCompleted(taskId: number): boolean {
    return this._completedTaskIds().includes(taskId);
  }

  // Get task history
  getTaskHistory(taskId: number): WritingHistoryDto[] {
    return this._history().filter(h => h.taskId === taskId);
  }

  // Get latest attempt for a task
  getLatestAttempt(taskId: number): WritingHistoryDto | null {
    const taskHistory = this.getTaskHistory(taskId);
    return taskHistory.length > 0 ? taskHistory[0] : null;
  }

  // Delete history entry
  deleteHistory(historyId: number): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.apiService.deleteHistory(historyId).pipe(
      tap(() => {
        // Remove from local history
        const currentHistory = this._history();
        this._history.set(currentHistory.filter(h => h.id !== historyId));
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting history:', error);
        this._error.set('Không thể xóa lịch sử');
        this._loading.set(false);
        throw error;
      })
    );
  }

  // Refresh data
  refresh(): void {
    this.loadUserData();
  }

  // Clear error
  clearError(): void {
    this._error.set(null);
  }
}
