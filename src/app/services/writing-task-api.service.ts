import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Page } from '../models/page.model';

export interface WritingTaskFilter {
  type?: string;
  task1Type?: string;
  task2Type?: string;
  difficulty?: string;
  isActive?: boolean;
  search?: string;
  sortField?: string;
  sortDirection?: string;
  page?: number;
  size?: number;
}

export interface WritingTaskDto {
  id?: number;
  title: string;
  instruction: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimit: number;
  wordCount: number;
  sampleAnswer?: string;
  writingGuide?: string; // Rich text HTML guide
  isActive: boolean;
  tags?: string[];
  tips?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface WritingTask1Dto extends WritingTaskDto {
  task1Type: 'LINE_GRAPH' | 'BAR_CHART' | 'PIE_CHART' | 'TABLE' | 'MIXED_GRAPH' | 'MAP' | 'PROCESS';
  description?: string;
  imageUrl?: string; // URL or Base64 string of the image/chart for Task 1
  data?: any;
}

export interface WritingTask2Dto extends WritingTaskDto {
  task2Type: 'AGREE_DISAGREE' | 'DISCUSSION' | 'ADVANTAGES_DISADVANTAGES' | 'CAUSES_PROBLEMS_SOLUTIONS' | 'TWO_PART_QUESTION' | 'POSITIVE_NEGATIVE_DEVELOPMENT';
  question: string;
  additionalQuestions?: string[];
}

export interface WritingTaskStatsDto {
  totalTasks: number;
  task1Count: number;
  task2Count: number;
  byDifficulty: { [key: string]: number };
  byTask1Type: { [key: string]: number };
  byTask2Type: { [key: string]: number };
  recentTasks: WritingTaskDto[];
}

import { AppConfig } from '../config/app.config';

@Injectable({
  providedIn: 'root'
})
export class WritingTaskApiService {
  private readonly apiUrl = `${AppConfig.api.baseUrl}/api/writing-tasks`;

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

  // Get Task1 types
  getTask1Types(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/task1/types`);
  }

  // Get Task2 types
  getTask2Types(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/task2/types`);
  }

  // Get difficulties
  getDifficulties(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/difficulties`);
  }
}
