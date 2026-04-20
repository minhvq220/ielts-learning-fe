import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';
import { AppConfig } from '../config/app.config';

export interface WritingTaskFilter {
  type?: string;
  task1Type?: string;
  task2Type?: string;
  difficulty?: string;
  source?: string;
  tag?: string;
  isActive?: boolean;
  search?: string;
  sortField?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export type WritingTaskSourceDto = 'CAMBRIDGE' | 'VOL' | 'ACTUAL_TESTS' | 'FORECAST' | 'OTHERS';

export interface WritingTaskDto {
  id?: number;
  title: string;
  instruction: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  wordCount: number;
  source?: WritingTaskSourceDto; // Nguồn đề
  sampleAnswer?: string;
  writingGuide?: string; // Rich text HTML guide
  isActive: boolean;
  tags?: string[];
  tips?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WritingTask1Dto extends WritingTaskDto {
  task1Type: string;
  description?: string;
  imageUrl?: string; // URL or Base64 string of the image/chart for Task 1
  data?: any;
}

export interface WritingTask2Dto extends WritingTaskDto {
  task2Type: string;
  question: string;
  additionalQuestions?: string[];
}

/** Một dòng catalog type (GET /task1/types, /task2/types). */
export interface WritingTaskTypeOptionDto {
  code: string;
  label: string;
}

export const FALLBACK_TASK1_TYPE_OPTIONS: WritingTaskTypeOptionDto[] = [
  { code: 'LINE_GRAPH', label: 'Line Graph' },
  { code: 'BAR_CHART', label: 'Bar Chart' },
  { code: 'PIE_CHART', label: 'Pie Chart' },
  { code: 'TABLE', label: 'Table' },
  { code: 'MIXED_GRAPH', label: 'Mixed Graph' },
  { code: 'MAP', label: 'Map' },
  { code: 'PROCESS', label: 'Process' }
];

export const FALLBACK_TASK2_TYPE_OPTIONS: WritingTaskTypeOptionDto[] = [
  { code: 'AGREE_DISAGREE', label: 'Agree or Disagree' },
  { code: 'DISCUSSION', label: 'Discussion' },
  { code: 'ADVANTAGES_DISADVANTAGES', label: 'Advantages and Disadvantages' },
  { code: 'CAUSES_PROBLEMS_SOLUTIONS', label: 'Causes, Problems and Solutions' },
  { code: 'TWO_PART_QUESTION', label: 'Two-Part Question' },
  { code: 'POSITIVE_NEGATIVE_DEVELOPMENT', label: 'Positive or Negative Development' }
];

export interface WritingTaskStatsDto {
  totalTasks: number;
  task1Count: number;
  task2Count: number;
  byDifficulty: { [key: string]: number };
  byTask1Type: { [key: string]: number };
  byTask2Type: { [key: string]: number };
  recentTasks: WritingTaskDto[];
}

export interface WritingBulkSetActiveResponse {
  updated: number;
}

export interface WritingBulkDeleteResponse {
  deleted: number;
}

@Injectable({
  providedIn: 'root'
})
export class WritingTaskApiService {
  private readonly apiUrl = `${AppConfig.api.baseUrl}/api/writing-tasks`;
  private readonly adminWritingTasksUrl = `${AppConfig.api.baseUrl}/api/admin/writing-tasks`;

  constructor(private http: HttpClient) {}

  // Get all tasks with filtering and pagination
  getTasks(filter: WritingTaskFilter = {}): Observable<Page<WritingTaskDto>> {
    let params = new HttpParams();
    
    Object.keys(filter).forEach(key => {
      const value = filter[key as keyof WritingTaskFilter];
      if (value !== undefined && value !== null) {
        params = params.set(key, value.toString());
      }
    });

    return this.http.get<Page<WritingTaskDto>>(this.apiUrl, { params });
  }

  // Get task by ID
  getTaskById(id: number): Observable<WritingTaskDto> {
    return this.http.get<WritingTaskDto>(`${this.apiUrl}/${id}`);
  }

  /** Admin: bật/tắt nhiều bài (is_active) */
  bulkSetActive(ids: number[], isActive: boolean): Observable<WritingBulkSetActiveResponse> {
    return this.http.post<WritingBulkSetActiveResponse>(`${this.adminWritingTasksUrl}/bulk-set-active`, {
      ids,
      isActive
    });
  }

  /** Admin: xóa nhiều bài */
  bulkDelete(ids: number[]): Observable<WritingBulkDeleteResponse> {
    return this.http.post<WritingBulkDeleteResponse>(`${this.adminWritingTasksUrl}/bulk-delete`, { ids });
  }

  // Create Task 1
  createTask1(task: WritingTask1Dto): Observable<WritingTask1Dto> {
    return this.http.post<WritingTask1Dto>(`${this.apiUrl}/task1`, task);
  }

  // Create Task 2
  createTask2(task: WritingTask2Dto): Observable<WritingTask2Dto> {
    return this.http.post<WritingTask2Dto>(`${this.apiUrl}/task2`, task);
  }

  // Update Task 1
  updateTask1(id: number, task: WritingTask1Dto): Observable<WritingTask1Dto> {
    return this.http.put<WritingTask1Dto>(`${this.apiUrl}/task1/${id}`, task);
  }

  // Update Task 2
  updateTask2(id: number, task: WritingTask2Dto): Observable<WritingTask2Dto> {
    return this.http.put<WritingTask2Dto>(`${this.apiUrl}/task2/${id}`, task);
  }

  // Delete task
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get statistics
  getStatistics(): Observable<WritingTaskStatsDto> {
    return this.http.get<WritingTaskStatsDto>(`${this.apiUrl}/stats`);
  }

  getTask1Types(): Observable<WritingTaskTypeOptionDto[]> {
    return this.http.get<WritingTaskTypeOptionDto[]>(`${this.apiUrl}/task1/types`);
  }

  getTask2Types(): Observable<WritingTaskTypeOptionDto[]> {
    return this.http.get<WritingTaskTypeOptionDto[]>(`${this.apiUrl}/task2/types`);
  }

  // Get difficulties
  getDifficulties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/difficulties`);
  }
}
