import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../services/subscription.service';
import { AnalyticsService } from '../../services/analytics.service';
import { SubscriptionStatus as SubscriptionStatusType, ProviderAccessStatus, SUBSCRIPTION_PRICE_ZAR, FOUNDERS_PRICE_ZAR } from '@findlocal/shared';

@Component({
  selector: 'app-subscription-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-status.html',
  styleUrl: './subscription-status.scss'
})
export class SubscriptionStatus {
  private subscriptionService = inject(SubscriptionService);
  private analytics = inject(AnalyticsService);

  @Input() status: SubscriptionStatusType = 'none';
  @Input() accessStatus: ProviderAccessStatus = 'none';
  @Input() endsAt: Date | null = null;
  @Input() trialEndsAt: Date | null = null;
  @Input() isFounder: boolean = false;

  loading = this.subscriptionService.loading;
  
  get subscriptionPrice(): number {
    return this.isFounder ? FOUNDERS_PRICE_ZAR : SUBSCRIPTION_PRICE_ZAR;
  }

  // Calculate days remaining in trial
  get trialDaysRemaining(): number {
    if (!this.trialEndsAt) return 0;
    const now = new Date();
    const trialEnd = new Date(this.trialEndsAt);
    const diffTime = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  }

  subscribe(): void {
    this.analytics.trackSubscriptionStart(`R${this.subscriptionPrice} Monthly Subscription`);
    this.subscriptionService.redirectToCheckout();
  }

  cancelSubscription(): void {
    if (confirm('Are you sure you want to cancel your subscription? Your profile will no longer be visible in search results.')) {
      this.subscriptionService.cancelSubscription().subscribe();
    }
  }

  pauseSubscription(): void {
    if (confirm('Pause your subscription? Billing will stop and your profile will be hidden from search results. You can resume anytime.')) {
      this.subscriptionService.pauseSubscription().subscribe();
    }
  }

  unpauseSubscription(): void {
    this.subscriptionService.unpauseSubscription().subscribe();
  }

  get statusLabel(): string {
    // Access status takes precedence for display
    if (this.accessStatus === 'trial') {
      return 'Free Trial';
    }
    if (this.accessStatus === 'expired') {
      return 'Trial Expired';
    }

    switch (this.status) {
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'paused':
        return 'Paused';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Not Subscribed';
    }
  }

  get statusColor(): string {
    // Access status takes precedence for styling
    if (this.accessStatus === 'trial') {
      return 'bg-primary-100 text-primary-700';
    }
    if (this.accessStatus === 'expired') {
      return 'bg-warning-100 text-warning-700';
    }

    switch (this.status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'past_due':
        return 'bg-warning-100 text-warning-700';
      case 'paused':
        return 'bg-gray-100 text-gray-600';
      case 'canceled':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
