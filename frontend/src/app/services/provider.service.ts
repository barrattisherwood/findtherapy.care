import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import {
  Provider,
  CreateProviderRequest,
  UpdateProviderRequest,
  ProviderSearchParams,
  ProviderListResponse,
} from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProviderService {
  private apiUrl = `${environment.apiUrl}/providers`;

  myProvider = signal<Provider | null>(null);
  providers = signal<Provider[]>([]);
  totalProviders = signal<number>(0);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // Create provider profile
  create(data: CreateProviderRequest): Observable<{ provider: Provider }> {
    return this.http.post<{ provider: Provider }>(this.apiUrl, data).pipe(
      tap(response => this.myProvider.set(response.provider))
    );
  }

  // Get current user's provider profile
  getMyProvider(): Observable<{ provider: Provider }> {
    return this.http.get<{ provider: Provider }>(`${this.apiUrl}/me`).pipe(
      tap(response => this.myProvider.set(response.provider))
    );
  }

  // Update current user's provider profile
  update(data: UpdateProviderRequest): Observable<{ provider: Provider }> {
    return this.http.put<{ provider: Provider }>(`${this.apiUrl}/me`, data).pipe(
      tap(response => this.myProvider.set(response.provider))
    );
  }

  // Delete current user's provider profile
  delete(): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/me`).pipe(
      tap(() => this.myProvider.set(null))
    );
  }

  // Search/list providers (public)
  search(params: ProviderSearchParams = {}): Observable<ProviderListResponse> {
    this.loading.set(true);

    let httpParams = new HttpParams();
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.city) httpParams = httpParams.set('city', params.city);
    if (params.specialty) httpParams = httpParams.set('specialty', params.specialty);
    if (params.maxRate !== undefined) httpParams = httpParams.set('maxRate', params.maxRate.toString());
    if (params.freeConsultation) httpParams = httpParams.set('freeConsultation', 'true');
    if (params.page) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

    return this.http.get<ProviderListResponse>(this.apiUrl, { params: httpParams }).pipe(
      tap(response => {
        this.providers.set(response.providers);
        this.totalProviders.set(response.total);
        this.currentPage.set(response.page);
        this.totalPages.set(response.totalPages);
        this.loading.set(false);
      })
    );
  }

  // Get provider by ID (public)
  getById(id: string): Observable<{ provider: Provider }> {
    return this.http.get<{ provider: Provider }>(`${this.apiUrl}/${id}`);
  }

  // Clear my provider (used on logout)
  clearMyProvider(): void {
    this.myProvider.set(null);
  }
}
