import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SubscriptionStatus } from '@findlocal/shared';
import { environment } from '../../environments/environment';

interface SubscriptionStatusResponse {
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
}

interface PayFastCheckoutResponse {
  url: string;
  data: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  subscriptionStatus = signal<SubscriptionStatus>('none');
  subscriptionEndsAt = signal<Date | null>(null);
  loading = signal<boolean>(false);

  constructor(private http: HttpClient) {}

  // Create PayFast checkout data
  createCheckout(): Observable<PayFastCheckoutResponse> {
    this.loading.set(true);
    return this.http.post<PayFastCheckoutResponse>(`${this.apiUrl}/create-checkout`, {}).pipe(
      tap({
        next: () => this.loading.set(false),
        error: () => this.loading.set(false)
      })
    );
  }

  // Get subscription status
  getStatus(): Observable<SubscriptionStatusResponse> {
    return this.http.get<SubscriptionStatusResponse>(`${this.apiUrl}/status`).pipe(
      tap(response => {
        this.subscriptionStatus.set(response.subscriptionStatus);
        this.subscriptionEndsAt.set(response.subscriptionEndsAt ? new Date(response.subscriptionEndsAt) : null);
      })
    );
  }

  // Cancel subscription
  cancelSubscription(): Observable<{ message: string }> {
    this.loading.set(true);
    return this.http.post<{ message: string }>(`${this.apiUrl}/cancel`, {}).pipe(
      tap({
        next: () => {
          this.loading.set(false);
          this.subscriptionStatus.set('canceled');
        },
        error: () => this.loading.set(false)
      })
    );
  }

  // Redirect to PayFast Checkout using form POST
  redirectToCheckout(): void {
    this.createCheckout().subscribe({
      next: (response) => {
        if (response.url && response.data) {
          // PayFast requires a form POST with hidden fields
          const form = document.createElement('form');
          form.method = 'POST';
          form.action = response.url;

          // Add all payment data as hidden fields
          for (const [key, value] of Object.entries(response.data)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = value;
            form.appendChild(input);
          }

          document.body.appendChild(form);
          form.submit();
        }
      },
      error: (error) => {
        console.error('Failed to create checkout session:', error);
      }
    });
  }

  // Clear status (used on logout)
  clearStatus(): void {
    this.subscriptionStatus.set('none');
    this.subscriptionEndsAt.set(null);
  }
}
