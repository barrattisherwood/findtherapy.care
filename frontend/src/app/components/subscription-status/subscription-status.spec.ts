import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { SubscriptionStatus } from './subscription-status';
import { SubscriptionService } from '../../services/subscription.service';
import { of } from 'rxjs';

describe('SubscriptionStatus Component', () => {
  let component: SubscriptionStatus;
  let fixture: ComponentFixture<SubscriptionStatus>;
  let mockSubscriptionService: Partial<SubscriptionService>;

  beforeEach(async () => {
    mockSubscriptionService = {
      loading: signal(false),
      redirectToCheckout: vi.fn(),
      cancelSubscription: vi.fn().mockReturnValue(of({ message: 'Canceled' })),
    };

    await TestBed.configureTestingModule({
      imports: [SubscriptionStatus, HttpClientTestingModule],
      providers: [
        { provide: SubscriptionService, useValue: mockSubscriptionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SubscriptionStatus);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Input Properties', () => {
    it('accepts status input with default value none', () => {
      expect(component.status).toBe('none');
    });

    it('accepts accessStatus input with default value none', () => {
      expect(component.accessStatus).toBe('none');
    });

    it('accepts endsAt input with default value null', () => {
      expect(component.endsAt).toBeNull();
    });

    it('accepts trialEndsAt input with default value null', () => {
      expect(component.trialEndsAt).toBeNull();
    });
  });

  describe('trialDaysRemaining getter', () => {
    it('returns 0 when trialEndsAt is null', () => {
      component.trialEndsAt = null;
      expect(component.trialDaysRemaining).toBe(0);
    });

    it('calculates correct days remaining', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      component.trialEndsAt = futureDate;

      expect(component.trialDaysRemaining).toBeGreaterThanOrEqual(14);
      expect(component.trialDaysRemaining).toBeLessThanOrEqual(16);
    });

    it('returns 0 for past dates', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      component.trialEndsAt = pastDate;

      expect(component.trialDaysRemaining).toBe(0);
    });

    it('handles date string conversion', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      component.trialEndsAt = futureDate;

      expect(component.trialDaysRemaining).toBeGreaterThan(0);
    });
  });

  describe('subscribe method', () => {
    it('calls subscriptionService.redirectToCheckout', () => {
      component.subscribe();

      expect(mockSubscriptionService.redirectToCheckout).toHaveBeenCalled();
    });
  });

  describe('cancelSubscription method', () => {
    it('shows confirmation dialog', () => {
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.cancelSubscription();

      expect(confirmSpy).toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it('calls subscriptionService.cancelSubscription on confirm', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(true);

      component.cancelSubscription();

      expect(mockSubscriptionService.cancelSubscription).toHaveBeenCalled();
    });

    it('does not call service on cancel', () => {
      vi.spyOn(window, 'confirm').mockReturnValue(false);

      component.cancelSubscription();

      expect(mockSubscriptionService.cancelSubscription).not.toHaveBeenCalled();
    });
  });

  describe('statusLabel getter', () => {
    it('returns Free Trial for trial accessStatus', () => {
      component.accessStatus = 'trial';
      expect(component.statusLabel).toBe('Free Trial');
    });

    it('returns Trial Expired for expired accessStatus', () => {
      component.accessStatus = 'expired';
      expect(component.statusLabel).toBe('Trial Expired');
    });

    it('returns Active for active subscription status', () => {
      component.accessStatus = 'none';
      component.status = 'active';
      expect(component.statusLabel).toBe('Active');
    });

    it('returns Past Due for past_due status', () => {
      component.accessStatus = 'none';
      component.status = 'past_due';
      expect(component.statusLabel).toBe('Past Due');
    });

    it('returns Canceled for canceled status', () => {
      component.accessStatus = 'none';
      component.status = 'canceled';
      expect(component.statusLabel).toBe('Canceled');
    });

    it('returns Not Subscribed for none status', () => {
      component.accessStatus = 'none';
      component.status = 'none';
      expect(component.statusLabel).toBe('Not Subscribed');
    });

    it('accessStatus takes precedence over subscription status', () => {
      component.accessStatus = 'trial';
      component.status = 'active';
      expect(component.statusLabel).toBe('Free Trial');
    });
  });

  describe('statusColor getter', () => {
    it('returns primary colors for trial', () => {
      component.accessStatus = 'trial';
      expect(component.statusColor).toContain('primary');
    });

    it('returns warning colors for expired', () => {
      component.accessStatus = 'expired';
      expect(component.statusColor).toContain('warning');
    });

    it('returns success colors for active', () => {
      component.accessStatus = 'none';
      component.status = 'active';
      expect(component.statusColor).toContain('success');
    });

    it('returns warning colors for past_due', () => {
      component.accessStatus = 'none';
      component.status = 'past_due';
      expect(component.statusColor).toContain('warning');
    });

    it('returns error colors for canceled', () => {
      component.accessStatus = 'none';
      component.status = 'canceled';
      expect(component.statusColor).toContain('error');
    });

    it('returns gray colors for none', () => {
      component.accessStatus = 'none';
      component.status = 'none';
      expect(component.statusColor).toContain('gray');
    });
  });

  describe('Template Rendering', () => {
    it('displays subscription price', () => {
      expect(component.subscriptionPrice).toBeDefined();
      expect(component.subscriptionPrice).toBeGreaterThan(0);
    });
  });
});
