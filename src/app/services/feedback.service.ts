import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config/app.config';
import { Page } from '../models/page.model';

export type FeedbackType = 'GENERAL_FEEDBACK' | 'BUG_REPORT' | 'CONTENT_REPORT' | 'FEATURE_REQUEST' | 'RATING';
export type FeedbackContextType = 'SYSTEM' | 'WRITING_TASK' | 'WRITING_HISTORY' | 'OTHER';
export type FeedbackStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'REJECTED';

export interface CreateFeedbackRequest {
  type: FeedbackType;
  contextType: FeedbackContextType;
  contextRefId?: number | null;
  title: string;
  content: string;
  rating?: number | null;
  contactEmail?: string | null;
}

export interface FeedbackDto {
  id: number;
  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  type: FeedbackType;
  contextType: FeedbackContextType;
  contextRefId?: number | null;
  title: string;
  content: string;
  rating?: number | null;
  status: FeedbackStatus;
  adminReply?: string | null;
  adminReplyAt?: string | null;
  adminReplyBy?: string | null;
  ipAddress?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface AdminFeedbackFilter {
  page?: number;
  size?: number;
  status?: FeedbackStatus;
  type?: FeedbackType;
  keyword?: string;
}

@Injectable({ providedIn: 'root' })
export class FeedbackService {
  private readonly API_URL = `${AppConfig.api.baseUrl}/api/feedback`;
  private readonly ADMIN_API_URL = `${AppConfig.api.baseUrl}/api/admin/feedback`;

  constructor(private http: HttpClient) {}

  createFeedback(payload: CreateFeedbackRequest): Observable<FeedbackDto> {
    return this.http.post<FeedbackDto>(this.API_URL, payload);
  }

  getMyFeedback(page = 0, size = 10): Observable<Page<FeedbackDto>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<FeedbackDto>>(`${this.API_URL}/my`, { params });
  }

  getAdminFeedback(filter: AdminFeedbackFilter = {}): Observable<Page<FeedbackDto>> {
    let params = new HttpParams()
      .set('page', (filter.page ?? 0).toString())
      .set('size', (filter.size ?? 20).toString());

    if (filter.status) params = params.set('status', filter.status);
    if (filter.type) params = params.set('type', filter.type);
    if (filter.keyword?.trim()) params = params.set('keyword', filter.keyword.trim());

    return this.http.get<Page<FeedbackDto>>(this.ADMIN_API_URL, { params });
  }

  getFeedbackById(id: number): Observable<FeedbackDto> {
    return this.http.get<FeedbackDto>(`${this.ADMIN_API_URL}/${id}`);
  }

  replyFeedback(id: number, adminReply: string, status: FeedbackStatus): Observable<FeedbackDto> {
    return this.http.put<FeedbackDto>(`${this.ADMIN_API_URL}/${id}/reply`, { adminReply, status });
  }

  updateFeedbackStatus(id: number, status: FeedbackStatus): Observable<FeedbackDto> {
    return this.http.put<FeedbackDto>(`${this.ADMIN_API_URL}/${id}/status`, { status });
  }
}
