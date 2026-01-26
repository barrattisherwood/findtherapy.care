import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContactProviderRequest, ContactProviderResponse } from '@findlocal/shared';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContactService {
  private apiUrl = `${environment.apiUrl}/providers`;

  constructor(private http: HttpClient) {}

  // Contact a provider
  contactProvider(providerId: string, data: ContactProviderRequest): Observable<ContactProviderResponse> {
    return this.http.post<ContactProviderResponse>(`${this.apiUrl}/${providerId}/contact`, data);
  }
}
