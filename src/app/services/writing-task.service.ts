import { Injectable, signal, computed, inject } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, map, switchMap } from 'rxjs';
import { 
  WritingTask, 
  WritingTask1, 
  WritingTask2, 
  WritingTaskFilter, 
  WritingTaskSort,
  WritingTaskStats,
  Task1Type,
  Task2Type
} from '../models/writing-task.model';
import {
  WritingTaskApiService,
  WritingTaskDto,
  WritingTask1Dto,
  WritingTask2Dto,
  WritingTaskStatsDto,
  WritingBulkSetActiveResponse,
  WritingBulkDeleteResponse
} from './writing-task-api.service';

/** API UPPER_SNAKE → kebab trong model FE (đồng bộ backend normalizeTypeCode). */
export function writingTaskTypeApiToKebab(raw: string | undefined | null): string {
  if (raw == null) return '';
  let s = String(raw).trim().toUpperCase().replace(/-/g, '_');
  s = s.replace(/[^A-Z0-9_]/g, '_');
  s = s.replace(/_+/g, '_');
  if (s.startsWith('_')) s = s.substring(1);
  if (s.endsWith('_')) s = s.substring(0, s.length - 1);
  if (!s) return '';
  if (s.length > 64) s = s.substring(0, 64);
  return s.toLowerCase().replace(/_/g, '-');
}

/** Kebab model → mã gửi API (UPPER_SNAKE). */
export function writingTaskTypeKebabToApi(raw: string | undefined | null): string {
  if (raw == null) return '';
  let s = String(raw).trim().toUpperCase().replace(/-/g, '_');
  s = s.replace(/[^A-Z0-9_]/g, '_');
  s = s.replace(/_+/g, '_');
  if (s.startsWith('_')) s = s.substring(1);
  if (s.endsWith('_')) s = s.substring(0, s.length - 1);
  if (s.length > 64) s = s.substring(0, 64);
  return s;
}

/** Hiển thị nhãn khi không có trong map cố định. */
export function formatTaskTypeKebabForDisplay(kebab: string): string {
  if (!kebab?.trim()) return '';
  return kebab
    .split('-')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' / ');
}

/** Admin stats from API (total counts), not from current page */
export interface AdminStats {
  totalTasks: number;
  task1Count: number;
  task2Count: number;
  byDifficulty: { easy: number; medium: number; hard: number };
}

@Injectable({
  providedIn: 'root'
})
export class WritingTaskService {
  private apiService = inject(WritingTaskApiService);
  private tasksSubject = new BehaviorSubject<WritingTask[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  // Signals for reactive state
  private _tasks = signal<WritingTask[]>([]);
  private _filter = signal<WritingTaskFilter>({});
  private _sort = signal<WritingTaskSort>({ field: 'createdAt', direction: 'desc' });
  private _loading = signal(false);
  private _error = signal<string | null>(null);
  // Pagination info from API
  private _totalElements = signal<number>(0);
  private _totalPages = signal<number>(0);
  private _currentPageNumber = signal<number>(0);

  // Admin stats from API (for dashboard totals)
  private _adminStats = signal<AdminStats | null>(null);

  // Computed values
  public filteredTasks = computed(() => {
    const tasks = this._tasks();
    const filter = this._filter();
    
    return tasks.filter(task => {
      if (filter.type && task.type !== filter.type) return false;
      if (filter.task1Type && task.type === 'task1' && task.task1Type !== filter.task1Type) return false;
      if (filter.task2Type && task.type === 'task2' && task.task2Type !== filter.task2Type) return false;
      if (filter.difficulty && task.difficulty !== filter.difficulty) return false;
      if (filter.isActive !== undefined && task.isActive !== filter.isActive) return false;
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        return task.title.toLowerCase().includes(searchLower) ||
               task.instruction.toLowerCase().includes(searchLower) ||
               task.tags.some(tag => tag.toLowerCase().includes(searchLower));
      }
      return true;
    });
  });

  public sortedTasks = computed(() => {
    const tasks = this.filteredTasks();
    const sort = this._sort();
    
    return [...tasks].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sort.field) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'difficulty':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          aValue = difficultyOrder[a.difficulty];
          bValue = difficultyOrder[b.difficulty];
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  public stats = computed(() => {
    const tasks = this._tasks();
    const byTask1Type: Record<string, number> = {};
    const byTask2Type: Record<string, number> = {};
    const stats: WritingTaskStats = {
      totalTasks: tasks.length,
      task1Count: tasks.filter(t => t.type === 'task1').length,
      task2Count: tasks.filter(t => t.type === 'task2').length,
      byDifficulty: {
        easy: tasks.filter(t => t.difficulty === 'easy').length,
        medium: tasks.filter(t => t.difficulty === 'medium').length,
        hard: tasks.filter(t => t.difficulty === 'hard').length
      },
      byTask1Type,
      byTask2Type,
      recentTasks: tasks
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
    };

    tasks.forEach(task => {
      if (task.type === 'task1') {
        const k = task.task1Type || '';
        byTask1Type[k] = (byTask1Type[k] ?? 0) + 1;
      } else if (task.type === 'task2') {
        const k = task.task2Type || '';
        byTask2Type[k] = (byTask2Type[k] ?? 0) + 1;
      }
    });

    return stats;
  });

  public loading = computed(() => this._loading());
  public error = computed(() => this._error());
  public totalElements = computed(() => this._totalElements());
  public totalPages = computed(() => this._totalPages());
  public currentPageNumber = computed(() => this._currentPageNumber());

  /** Current page content from API (for admin server-side pagination) */
  public currentPageTasks = computed(() => this._tasks());

  /** Admin dashboard stats from API (totals, not from current page) */
  public adminStats = computed(() => this._adminStats());

  constructor() {
    this.loadTasks();
  }

  // CRUD Operations
  loadTasks(page: number = 0, size: number = 10): void {
    this._loading.set(true);
    this._error.set(null);
    
    const filter = this._filter();
    this.apiService.getTasks({
      type: filter.type,
      task1Type: filter.task1Type,
      task2Type: filter.task2Type,
      difficulty: filter.difficulty,
      source: filter.source,
      tag: filter.tag,
      isActive: filter.isActive,
      search: filter.search,
      sortField: this._sort().field,
      sortDirection: this._sort().direction,
      page: page,
      size: size
    }).pipe(
      tap(pageResponse => {
        const convertedTasks = pageResponse.content.map(dto => this.convertDtoToModel(dto));
        this._tasks.set(convertedTasks);
        this.tasksSubject.next(convertedTasks);
        // Save pagination info from API
        this._totalElements.set(pageResponse.totalElements);
        this._totalPages.set(pageResponse.totalPages);
        this._currentPageNumber.set(pageResponse.number);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error loading tasks:', error);
        this._error.set('Không thể tải danh sách bài viết');
        this._loading.set(false);
        // Fallback to mock data
        this.loadMockData();
        return of([]);
      })
    ).subscribe();
  }

  getTasks(): Observable<WritingTask[]> {
    return this.tasks$;
  }

  getTaskById(id: string): WritingTask | undefined {
    return this._tasks().find(task => task.id === id);
  }

  // Load task details by ID from API (includes imageUrl)
  loadTaskById(id: string): Observable<WritingTask> {
    this._loading.set(true);
    this._error.set(null);
    
    return this.apiService.getTaskById(Number(id)).pipe(
      map(dto => {
        const task = this.convertDtoToModel(dto);
        // Update cached task if exists
        const tasks = this._tasks();
        const index = tasks.findIndex(t => t.id === id);
        if (index >= 0) {
          tasks[index] = task;
          this._tasks.set([...tasks]);
          this.tasksSubject.next([...tasks]);
        }
        this._loading.set(false);
        return task;
      }),
      catchError(error => {
        console.error('Error loading task details:', error);
        this._error.set('Không thể tải chi tiết bài viết');
        this._loading.set(false);
        throw error;
      })
    );
  }

  createTask(task: Omit<WritingTask, 'id' | 'createdAt' | 'updatedAt'>): Observable<WritingTask> {
    this._loading.set(true);
    this._error.set(null);

    if (task.type === 'task1') {
      const task1Dto = this.convertModelToTask1Dto(task as WritingTask1);
      return this.apiService.createTask1(task1Dto).pipe(
        tap(createdDto => {
          const newTask = this.convertDtoToModel(createdDto);
          const tasks = [...this._tasks(), newTask];
          this._tasks.set(tasks);
          this.tasksSubject.next(tasks);
          this._loading.set(false);
        }),
        catchError(error => {
          console.error('Error creating task1:', error);
          this._error.set('Không thể tạo bài Task 1');
          this._loading.set(false);
          throw error;
        }),
        map(createdDto => this.convertDtoToModel(createdDto))
      );
    } else {
      const task2Dto = this.convertModelToTask2Dto(task as WritingTask2);
      return this.apiService.createTask2(task2Dto).pipe(
        tap(createdDto => {
          const newTask = this.convertDtoToModel(createdDto);
          const tasks = [...this._tasks(), newTask];
          this._tasks.set(tasks);
          this.tasksSubject.next(tasks);
          this._loading.set(false);
        }),
        catchError(error => {
          console.error('Error creating task2:', error);
          this._error.set('Không thể tạo bài Task 2');
          this._loading.set(false);
          throw error;
        }),
        map(createdDto => this.convertDtoToModel(createdDto))
      );
    }
  }

  updateTask(id: string, updates: Partial<WritingTask>): Observable<WritingTask> {
    this._loading.set(true);
    this._error.set(null);

    const existingTask = this._tasks().find(task => task.id === id);
    if (!existingTask) {
      this._loading.set(false);
      throw new Error('Task not found');
    }

    const updatedTask = { ...existingTask, ...updates };

    if (updatedTask.type === 'task1') {
      const task1Dto = this.convertModelToTask1Dto(updatedTask as WritingTask1);
      return this.apiService.updateTask1(Number(id), task1Dto).pipe(
        tap(updatedDto => {
          const convertedTask = this.convertDtoToModel(updatedDto);
          const tasks = this._tasks().map(task => 
            task.id === id ? convertedTask : task
          );
          this._tasks.set(tasks);
          this.tasksSubject.next(tasks);
          this._loading.set(false);
        }),
        catchError(error => {
          console.error('Error updating task1:', error);
          this._error.set('Không thể cập nhật bài Task 1');
          this._loading.set(false);
          throw error;
        }),
        map(updatedDto => this.convertDtoToModel(updatedDto))
      );
    } else {
      const task2Dto = this.convertModelToTask2Dto(updatedTask as WritingTask2);
      return this.apiService.updateTask2(Number(id), task2Dto).pipe(
        tap(updatedDto => {
          const convertedTask = this.convertDtoToModel(updatedDto);
          const tasks = this._tasks().map(task => 
            task.id === id ? convertedTask : task
          );
          this._tasks.set(tasks);
          this.tasksSubject.next(tasks);
          this._loading.set(false);
        }),
        catchError(error => {
          console.error('Error updating task2:', error);
          this._error.set('Không thể cập nhật bài Task 2');
          this._loading.set(false);
          throw error;
        }),
        map(updatedDto => this.convertDtoToModel(updatedDto))
      );
    }
  }

  /** Admin: cập nhật is_active cho nhiều bài */
  bulkSetActive(ids: string[], isActive: boolean): Observable<WritingBulkSetActiveResponse> {
    const numeric = ids.map(id => Number(id)).filter(n => Number.isFinite(n) && n > 0);
    return this.apiService.bulkSetActive(numeric, isActive);
  }

  bulkDelete(ids: string[]): Observable<WritingBulkDeleteResponse> {
    const numeric = ids.map(id => Number(id)).filter(n => Number.isFinite(n) && n > 0);
    return this.apiService.bulkDelete(numeric);
  }

  deleteTask(id: string): Observable<void> {
    this._loading.set(true);
    this._error.set(null);

    return this.apiService.deleteTask(Number(id)).pipe(
      tap(() => {
        const tasks = this._tasks().filter(task => task.id !== id);
        this._tasks.set(tasks);
        this.tasksSubject.next(tasks);
        this._loading.set(false);
      }),
      catchError(error => {
        console.error('Error deleting task:', error);
        this._error.set('Không thể xóa bài viết');
        this._loading.set(false);
        throw error;
      })
    );
  }

  // Filter and Sort Operations
  setFilter(filter: WritingTaskFilter): void {
    this._filter.set(filter);
    // Don't auto-reload here - let component call loadTasks with proper pagination
  }

  setSort(sort: WritingTaskSort): void {
    this._sort.set(sort);
    // Don't auto-reload here - let component call loadTasks with proper pagination
  }

  clearFilter(): void {
    this._filter.set({});
    // Don't auto-reload here - let component call loadTasks with proper pagination
  }

  /** Load statistics from API for admin dashboard */
  loadStatistics(): void {
    this.apiService.getStatistics().pipe(
      tap((dto: WritingTaskStatsDto) => {
        const byDifficulty = {
          easy: dto.byDifficulty?.['EASY'] ?? 0,
          medium: dto.byDifficulty?.['MEDIUM'] ?? 0,
          hard: dto.byDifficulty?.['HARD'] ?? 0
        };
        this._adminStats.set({
          totalTasks: dto.totalTasks ?? 0,
          task1Count: dto.task1Count ?? 0,
          task2Count: dto.task2Count ?? 0,
          byDifficulty
        });
      }),
      catchError(() => of(null))
    ).subscribe();
  }

  // Utility Methods
  private generateId(): string {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Conversion methods between DTO and Model
  private convertDtoToModel(dto: WritingTaskDto): WritingTask {
    const baseTask = {
      id: dto.id?.toString() || '',
      title: dto.title,
      instruction: dto.instruction,
      difficulty: dto.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard',
      timeLimit: dto.timeLimit,
      wordCount: dto.wordCount,
      source: dto.source,
      createdAt: dto.createdAt ? new Date(dto.createdAt) : new Date(),
      updatedAt: dto.updatedAt ? new Date(dto.updatedAt) : new Date(),
      isActive: dto.isActive,
      tags: dto.tags || [],
      sampleAnswer: dto.sampleAnswer || '',
      writingGuide: dto.writingGuide || '',
      tips: dto.tips || []
    };

    // Determine if it's Task1 or Task2 based on available properties
    if ('task1Type' in dto) {
      return {
        ...baseTask,
        type: 'task1' as const,
        task1Type: writingTaskTypeApiToKebab((dto as WritingTask1Dto).task1Type) as Task1Type,
        description: (dto as WritingTask1Dto).description || '',
        imageUrl: (dto as WritingTask1Dto).imageUrl || '',
        data: (dto as WritingTask1Dto).data || {}
      } as WritingTask1;
    } else {
      return {
        ...baseTask,
        type: 'task2' as const,
        task2Type: writingTaskTypeApiToKebab((dto as WritingTask2Dto).task2Type) as Task2Type,
        question: (dto as WritingTask2Dto).question || '',
        additionalQuestions: (dto as WritingTask2Dto).additionalQuestions || []
      } as WritingTask2;
    }
  }

  private convertModelToTask1Dto(task: WritingTask1): WritingTask1Dto {
    return {
      title: task.title,
      instruction: task.instruction,
      task1Type: writingTaskTypeKebabToApi(task.task1Type),
      difficulty: task.difficulty.toUpperCase() as any,
      timeLimit: task.timeLimit,
      wordCount: task.wordCount,
      source: task.source,
      sampleAnswer: task.sampleAnswer,
      writingGuide: task.writingGuide,
      isActive: task.isActive,
      tags: task.tags,
      tips: task.tips,
      description: task.description,
      imageUrl: task.imageUrl || '',
      data: task.data
    };
  }

  private convertModelToTask2Dto(task: WritingTask2): WritingTask2Dto {
    return {
      title: task.title,
      instruction: task.instruction,
      task2Type: writingTaskTypeKebabToApi(task.task2Type),
      difficulty: task.difficulty.toUpperCase() as any,
      timeLimit: task.timeLimit,
      wordCount: task.wordCount,
      source: task.source,
      sampleAnswer: task.sampleAnswer,
      writingGuide: task.writingGuide,
      isActive: task.isActive,
      tags: task.tags,
      tips: task.tips,
      question: task.question,
      additionalQuestions: task.additionalQuestions
    };
  }

  private loadMockData(): void {
    const mockTasks: WritingTask[] = [
      // Task 1 Examples
      {
        id: 'task1_1',
        type: 'task1',
        title: 'Population Growth in Major Cities',
        instruction: 'The line graph shows the population growth in three major cities from 1990 to 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.',
        task1Type: 'line-graph',
        difficulty: 'medium',
        timeLimit: 20,
        wordCount: 150,
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isActive: true,
        tags: ['population', 'cities', 'growth'],
        description: 'Line graph showing population growth trends',
        data: {
          chartData: {
            title: 'Population Growth in Major Cities (1990-2020)',
            xAxisLabel: 'Year',
            yAxisLabel: 'Population (millions)',
            categories: ['1990', '1995', '2000', '2005', '2010', '2015', '2020'],
            series: [
              { name: 'New York', data: [7.3, 7.5, 8.0, 8.2, 8.4, 8.5, 8.8] },
              { name: 'London', data: [6.8, 7.0, 7.2, 7.5, 7.8, 8.1, 8.3] },
              { name: 'Tokyo', data: [11.9, 12.0, 12.1, 12.2, 12.3, 12.4, 12.5] }
            ]
          }
        },
        sampleAnswer: 'The line graph illustrates the population growth in three major cities from 1990 to 2020...',
        tips: ['Focus on trends and comparisons', 'Use appropriate vocabulary for describing changes']
      },
      {
        id: 'task1_2',
        type: 'task1',
        title: 'Energy Consumption by Source',
        instruction: 'The bar chart shows the energy consumption by different sources in 2020. Summarize the information by selecting and reporting the main features.',
        task1Type: 'bar-chart',
        difficulty: 'easy',
        timeLimit: 20,
        wordCount: 150,
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        isActive: true,
        tags: ['energy', 'consumption', 'sources'],
        description: 'Bar chart showing energy consumption by source',
        data: {
          chartData: {
            title: 'Energy Consumption by Source (2020)',
            xAxisLabel: 'Energy Source',
            yAxisLabel: 'Consumption (%)',
            categories: ['Coal', 'Oil', 'Natural Gas', 'Nuclear', 'Renewables'],
            series: [
              { name: 'Consumption', data: [35, 25, 20, 10, 10] }
            ]
          }
        }
      },
      // Task 2 Examples
      {
        id: 'task2_1',
        type: 'task2',
        title: 'Technology and Social Relationships',
        instruction: 'Some people believe that technology has made our lives more complicated, while others think it has made our lives easier. Discuss both views and give your own opinion.',
        task2Type: 'discussion',
        difficulty: 'medium',
        timeLimit: 40,
        wordCount: 250,
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        isActive: true,
        tags: ['technology', 'social', 'relationships'],
        question: 'Some people believe that technology has made our lives more complicated, while others think it has made our lives easier. Discuss both views and give your own opinion.',
        sampleAnswer: 'Technology has undoubtedly transformed the way we live, work, and interact with others...',
        tips: ['Present both sides fairly', 'Use linking words effectively', 'Give clear personal opinion']
      },
      {
        id: 'task2_2',
        type: 'task2',
        title: 'Online Learning vs Traditional Education',
        instruction: 'Online learning is becoming increasingly popular. What are the advantages and disadvantages of this trend?',
        task2Type: 'advantages-disadvantages',
        difficulty: 'easy',
        timeLimit: 40,
        wordCount: 250,
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        isActive: true,
        tags: ['education', 'online learning', 'technology'],
        question: 'Online learning is becoming increasingly popular. What are the advantages and disadvantages of this trend?'
      }
    ];

    this._tasks.set(mockTasks);
    this.tasksSubject.next(mockTasks);
  }

  // Export/Import functionality
  exportTasks(): string {
    return JSON.stringify(this._tasks(), null, 2);
  }

  importTasks(jsonData: string): boolean {
    try {
      const tasks = JSON.parse(jsonData);
      if (Array.isArray(tasks)) {
        this._tasks.set(tasks);
        this.tasksSubject.next(tasks);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
