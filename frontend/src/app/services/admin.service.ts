import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DashboardMetrics, VetProviderRequest } from '@findlocal/shared';
import { environment } from '../../environments/environment';

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
}

export interface PendingProviderListResponse {
  providers: PendingProvider[];
  total: number;
  page: number;
  totalPages: number;
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

  getProviders(status: string = 'pending', page: number = 1, limit: number = 20): Observable<PendingProviderListResponse> {
    let params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<PendingProviderListResponse>(`${this.apiUrl}/providers`, { params });
  }

  vetProvider(id: string, data: VetProviderRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/providers/${id}/vet`, data);
  }

  getPendingCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/providers/pending-count`).pipe(
      tap(res => this.pendingCount.set(res.count))
    );
  }
}
