import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface ArclinkResponse {
  ok: boolean;
}

@Injectable({ providedIn: 'root' })
export class FormsService {
  private http = inject(HttpClient);

  submit(url: string, data: Record<string, string>): Observable<ArclinkResponse> {
    return this.http.post<ArclinkResponse>(url, data).pipe(
      map(response => {
        if (!response.ok) {
          throw new Error('Submission failed');
        }
        return response;
      }),
      catchError(error => {
        const status = error.status;
        const errorBody = error.error;

        let message: string;
        if (errorBody?.error) {
          message = errorBody.error;
        } else if (status === 422) {
          message = 'Please complete the security verification.';
        } else if (status === 429) {
          message = 'Too many requests. Please try again in a few minutes.';
        } else {
          message = 'Failed to send message. Please try again.';
        }

        return throwError(() => new Error(message));
      })
    );
  }
}
