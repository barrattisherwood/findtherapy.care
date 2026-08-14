import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { ProviderVerificationStatus, ProviderDocumentType } from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProviderDocumentService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/provider/documents`;

  status = signal<ProviderVerificationStatus | null>(null);
  loading = signal(false);
  uploading = signal(false);

  loadStatus() {
    this.loading.set(true);
    return this.http.get<ProviderVerificationStatus>(`${this.baseUrl}/verification-status`).pipe(
      tap({
        next: (s) => {
          this.status.set(s);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      })
    );
  }

  upload(file: File, documentType: ProviderDocumentType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    this.uploading.set(true);
    return this.http.post<{ id: string; documentType: string }>(
      `${this.baseUrl}/upload`,
      formData
    ).pipe(
      tap({
        next: () => {
          this.uploading.set(false);
          this.loadStatus().subscribe();
        },
        error: () => this.uploading.set(false),
      })
    );
  }
}
