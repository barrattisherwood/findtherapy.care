import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { SubscriptionStatus, ProviderAccessStatus } from '@findlocal/shared';
import { environment } from '../../environments/environment';

interface SubscriptionStatusResponse {
  subscriptionStatus: SubscriptionStatus;
  subscriptionEndsAt?: Date;
  trialEndsAt?: Date;
  accessStatus: ProviderAccessStatus;
  isFounder?: boolean;
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
  trialEndsAt = signal<Date | null>(null);
  accessStatus = signal<ProviderAccessStatus>('none');
  isFounder = signal<boolean>(false);
  loading = signal<boolean>(false);

  // Computed: days remaining in trial
  trialDaysRemaining = computed(() => {
    const trialEnd = this.trialEndsAt();
    if (!trialEnd) return 0;
    const now = new Date();
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  });

  // Computed: has active access (trial or subscription)
  hasAccess = computed(() => {
    const status = this.accessStatus();
    return status === 'trial' || status === 'active';
  });

  constructor(private http: HttpClient) {}

  // Create PayFast checkout data
  createCheckout(): Observable<PayFastCheckoutResponse> {
    return this.http.post<PayFastCheckoutResponse>(`${this.apiUrl}/create-checkout`, {}).pipe(
      tap({
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
        this.trialEndsAt.set(response.trialEndsAt ? new Date(response.trialEndsAt) : null);
        this.accessStatus.set(response.accessStatus);
        this.isFounder.set(response.isFounder ?? false);
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
    this.loading.set(true);
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
          // Keep loading state true - user is being redirected to PayFast
        }
      },
      error: (error) => {
        console.error('Failed to create checkout session:', error);
        this.loading.set(false);
      }
    });
  }

  // Clear status (used on logout)
  clearStatus(): void {
    this.subscriptionStatus.set('none');
    this.subscriptionEndsAt.set(null);
    this.trialEndsAt.set(null);
    this.accessStatus.set('none');
    this.isFounder.set(false);
  }
}
