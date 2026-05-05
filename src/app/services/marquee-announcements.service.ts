import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../config/app.config';

export interface MarqueeLinePublic {
  message: string;
}

export interface MarqueeAnnouncementsPublicResponse {
  lines: MarqueeLinePublic[];
}

export interface MarqueeLineAdmin {
  id: number;
  message: string;
  enabled: boolean;
  sortOrder: number;
  startsAt: string | null;
  endsAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SiteMarqueeLineRequestBody {
  message: string;
  enabled?: boolean;
  sortOrder?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class MarqueeAnnouncementsService {
  private readonly publicUrl = `${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/marquee-announcements`;
  private readonly adminUrl = `${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/admin/marquee-announcements`;

  constructor(private http: HttpClient) {}

  getActive(): Observable<MarqueeAnnouncementsPublicResponse> {
    return this.http.get<MarqueeAnnouncementsPublicResponse>(this.publicUrl);
  }

  listAdmin(): Observable<MarqueeLineAdmin[]> {
    return this.http.get<MarqueeLineAdmin[]>(this.adminUrl);
  }

  createAdmin(body: SiteMarqueeLineRequestBody): Observable<MarqueeLineAdmin> {
    return this.http.post<MarqueeLineAdmin>(this.adminUrl, body);
  }

  updateAdmin(id: number, body: SiteMarqueeLineRequestBody): Observable<MarqueeLineAdmin> {
    return this.http.put<MarqueeLineAdmin>(`${this.adminUrl}/${id}`, body);
  }

  deleteAdmin(id: number): Observable<void> {
    return this.http.delete<void>(`${this.adminUrl}/${id}`);
  }
}
