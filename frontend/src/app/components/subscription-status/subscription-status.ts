import { Component, inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionService } from '../../services/subscription.service';
import { SubscriptionStatus as SubscriptionStatusType } from '@findlocal/shared';

@Component({
  selector: 'app-subscription-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscription-status.html',
  styleUrl: './subscription-status.scss'
})
export class SubscriptionStatus {
  private subscriptionService = inject(SubscriptionService);

  @Input() status: SubscriptionStatusType = 'none';
  @Input() endsAt: Date | null = null;

  loading = this.subscriptionService.loading;

  subscribe(): void {
    this.subscriptionService.redirectToCheckout();
  }

  cancelSubscription(): void {
    if (confirm('Are you sure you want to cancel your subscription? Your profile will no longer be visible in search results.')) {
      this.subscriptionService.cancelSubscription().subscribe();
    }
  }

  get statusLabel(): string {
    switch (this.status) {
      case 'active':
        return 'Active';
      case 'past_due':
        return 'Past Due';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Not Subscribed';
    }
  }

  get statusColor(): string {
    switch (this.status) {
      case 'active':
        return 'bg-success-100 text-success-700';
      case 'past_due':
        return 'bg-warning-100 text-warning-700';
      case 'canceled':
        return 'bg-error-100 text-error-700';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
