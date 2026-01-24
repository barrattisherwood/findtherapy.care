import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  SupportGroup,
  SupportGroupSearchParams,
  SupportGroupListResponse,
} from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupportGroupService {
  private apiUrl = `${environment.apiUrl}/support-groups`;

  supportGroups = signal<SupportGroup[]>([]);
  totalSupportGroups = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // Search/list support groups (public)
  search(params: SupportGroupSearchParams = {}): Observable<SupportGroupListResponse> {
    this.loading.set(true);

    let httpParams = new HttpParams();
    if (params.category) httpParams = httpParams.set('category', params.category);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.meetingType) httpParams = httpParams.set('meetingType', params.meetingType);
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<SupportGroupListResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => {
        this.supportGroups.set(response.supportGroups);
        this.totalSupportGroups.set(response.total);
        this.currentPage.set(response.page);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      })
    );
  }

  // Get support group by ID (public)
  getById(id: string): Observable<{ supportGroup: SupportGroup }> {
    return this.http.get<{ supportGroup: SupportGroup }>(`${this.apiUrl}/${id}`);
  }
}
