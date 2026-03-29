import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config/app.config';
import { Page } from '../models/page.model';

export interface NotificationDto {
  id: number;
  type: 'FEEDBACK_REPLIED' | 'FEEDBACK_CREATED';
  title: string;
  message: string;
  targetType: 'FEEDBACK';
  targetId?: number;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_URL = `${AppConfig.api.baseUrl}/api/notifications`;

  constructor(private http: HttpClient) {}

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.API_URL}/unread-count`);
  }

  getMyNotifications(page = 0, size = 10): Observable<Page<NotificationDto>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<NotificationDto>>(this.API_URL, { params });
  }

  markAsRead(id: number): Observable<NotificationDto> {
    return this.http.put<NotificationDto>(`${this.API_URL}/${id}/read`, {});
  }

  markAllAsRead(): Observable<{ updated: number }> {
    return this.http.put<{ updated: number }>(`${this.API_URL}/read-all`, {});
  }
}
