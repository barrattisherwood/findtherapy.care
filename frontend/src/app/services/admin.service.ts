import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DashboardMetrics, VetProviderRequest, ProviderAccessStatus } from '@findlocal/shared';
import { environment } from '../../environments/environment';

export interface PendingProviderDocument {
  id: string;
  documentType: string;
  fileName: string;
  fileType: string;
  uploadedAt: Date | string;
  reviewedAt?: Date | string;
  reviewOutcome?: 'approved' | 'rejected';
  fileAvailable: boolean;
}

export interface PendingProvider {
  id: string;
  displayName: string;
  type: string;
  professionalBodies: Array<{
    body: string;
    otherBodyName?: string;
    registrationNumber: string;
  }>;
  vettingStatus: string;
  vettingNotes?: string;
  vettedAt?: Date;
  contactEmail: string;
  createdAt: Date;
  documents: PendingProviderDocument[];
}

export interface PendingProviderListResponse {
  providers: PendingProvider[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminProvider {
  id: string;
  displayName: string;
  type: string;
  contactEmail: string;
  vettingStatus: string;
  isPublished: boolean;
  isSuspended: boolean;
  subscriptionStatus: string;
  accessStatus: ProviderAccessStatus;
  trialEndsAt?: Date;
  viewCount: number;
  isFounder: boolean;
  founderNumber?: number;
  profileImage?: string;
  createdAt: Date;
  isAdmin: boolean;
}

export interface AdminProviderListResponse {
  providers: AdminProvider[];
  total: number;
  page: number;
  totalPages: number;
}

export interface AdminLog {
  id: string;
  action: 'vet_provider' | 'suspend_provider' | 'unsuspend_provider' | 'delete_provider' | 'set_founder' | 'remove_founder' | 'mark_message_read';
  adminId: string;
  adminEmail: string;
  targetId: string;
  targetName: string;
  details?: Record<string, any>;
  createdAt: Date;
}

export interface AdminLogListResponse {
  logs: AdminLog[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SentryIssue {
  id: string;
  title: string;
  level: 'error' | 'warning' | 'info';
  count: string;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  permalink: string;
}

export interface SentryIssuesResponse {
  configured: boolean;
  issues: SentryIssue[];
}

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  allowlistedAdminIds: string[];
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  loading = signal(false);
  pendingCount = signal(0);

  constructor(private http: HttpClient) {}

  getDashboardMetrics(days: number = 30): Observable<DashboardMetrics> {
    this.loading.set(true);
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard`, {
      params: { days: days.toString() }
    }).pipe(
      tap(() => this.loading.set(false))
    );
  }

  getDocumentBlob(documentId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/provider/documents/${documentId}`, { responseType: 'blob' });
  }

  // Vetting-specific list (pending/approved/rejected)
  getVettingProviders(status: string = 'pending', page: number = 1, limit: number = 20): Observable<PendingProviderListResponse> {
    let params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PendingProviderListResponse>(`${this.apiUrl}/providers/vetting`, { params });
  }

  // Full provider list with all filters
  getAllProviders(options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    vetting?: string;
    type?: string;
    sortBy?: string;
    sortDir?: 'asc' | 'desc';
  } = {}): Observable<AdminProviderListResponse> {
    let params = new HttpParams()
      .set('page', (options.page || 1).toString())
      .set('limit', (options.limit || 20).toString());

    if (options.search) params = params.set('search', options.search);
    if (options.status) params = params.set('status', options.status);
    if (options.vetting) params = params.set('vetting', options.vetting);
    if (options.type) params = params.set('type', options.type);
    if (options.sortBy) params = params.set('sortBy', options.sortBy);
    if (options.sortDir) params = params.set('sortDir', options.sortDir);

    return this.http.get<AdminProviderListResponse>(`${this.apiUrl}/providers`, { params });
  }

  vetProvider(id: string, data: VetProviderRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/providers/${id}/vet`, data);
  }

  suspendProvider(id: string, suspended: boolean, reason?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/providers/${id}/suspend`, { suspended, reason });
  }

  deleteProvider(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/providers/${id}`);
  }

  setFounderStatus(id: string, isFounder: boolean): Observable<any> {
    return this.http.post(`${this.apiUrl}/providers/${id}/founder`, { isFounder });
  }

  getPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/providers/pending-count`).pipe(
      tap(res => this.pendingCount.set(res.count))
    );
  }

  pendingBlogCount = signal(0);

  getPendingBlogPosts(): Observable<{ posts: any[]; total: number }> {
    return this.http.get<{ posts: any[]; total: number }>(`${this.apiUrl}/blog/pending`).pipe(
      tap(res => this.pendingBlogCount.set(res.total))
    );
  }

  reviewBlogPost(id: string, action: 'approve' | 'reject', rejectionReason?: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/blog/${id}/review`, { action, rejectionReason });
  }

  getAdminLogs(page: number = 1, action: string = ''): Observable<AdminLogListResponse> {
    let params = new HttpParams().set('page', page.toString()).set('limit', '25');
    if (action) params = params.set('action', action);
    return this.http.get<AdminLogListResponse>(`${this.apiUrl}/logs`, { params });
  }

  getSentryIssues(): Observable<SentryIssuesResponse> {
    return this.http.get<SentryIssuesResponse>(`${this.apiUrl}/sentry-issues`);
  }

  getFeatureFlags(): Observable<{ flags: FeatureFlag[] }> {
    return this.http.get<{ flags: FeatureFlag[] }>(`${this.apiUrl}/feature-flags`);
  }

  toggleFeatureFlag(key: string, enabled: boolean): Observable<{ flag: FeatureFlag }> {
    return this.http.patch<{ flag: FeatureFlag }>(`${this.apiUrl}/feature-flags/${key}`, { enabled });
  }
}
