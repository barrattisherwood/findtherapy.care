import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { DashboardMetrics } from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;

  loading = signal(false);

  constructor(private http: HttpClient) {}

  getDashboardMetrics(days: number = 30): Observable<DashboardMetrics> {
    this.loading.set(true);
    return this.http.get<DashboardMetrics>(`${this.apiUrl}/dashboard`, {
      params: { days: days.toString() }
    }).pipe(
      tap(() => this.loading.set(false))
    );
  }
}
