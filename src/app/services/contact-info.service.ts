import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AppConfig } from '../config/app.config';

export interface ContactInfo {
  id?: number;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  telegramUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ContactInfoService {
  private readonly API_URL = `${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/contact-info`;
  private readonly ADMIN_API_URL = `${AppConfig.api.baseUrl}${AppConfig.api.apiBasePath}/admin/contact-info`;
  
  private contactInfo = signal<ContactInfo | null>(null);

  constructor(private http: HttpClient) {}

  /**
   * Get contact information (public)
   */
  getContactInfo(): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(this.API_URL).pipe(
      tap(info => this.contactInfo.set(info))
    );
  }

  /**
   * Get contact information (admin)
   */
  getContactInfoAdmin(): Observable<ContactInfo> {
    return this.http.get<ContactInfo>(this.ADMIN_API_URL).pipe(
      tap(info => this.contactInfo.set(info))
    );
  }

  /**
   * Update contact information (admin only)
   */
  updateContactInfo(contactInfo: ContactInfo): Observable<ContactInfo> {
    return this.http.put<ContactInfo>(this.ADMIN_API_URL, contactInfo).pipe(
      tap(info => this.contactInfo.set(info))
    );
  }

  /**
   * Get cached contact info
   */
  getCachedContactInfo(): ContactInfo | null {
    return this.contactInfo();
  }
}

