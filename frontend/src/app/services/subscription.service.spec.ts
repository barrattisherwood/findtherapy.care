import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionService } from './subscription.service';
import { environment } from '../../environments/environment';

describe('SubscriptionService', () => {
  let service: SubscriptionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubscriptionService],
    });
    service = TestBed.inject(SubscriptionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Signal Initialization', () => {
    it('initializes subscriptionStatus to none', () => {
      expect(service.subscriptionStatus()).toBe('none');
    });

    it('initializes subscriptionEndsAt to null', () => {
      expect(service.subscriptionEndsAt()).toBeNull();
    });

    it('initializes trialEndsAt to null', () => {
      expect(service.trialEndsAt()).toBeNull();
    });

    it('initializes accessStatus to none', () => {
      expect(service.accessStatus()).toBe('none');
    });

    it('initializes loading to false', () => {
      expect(service.loading()).toBe(false);
    });
  });

  describe('trialDaysRemaining computed', () => {
    it('returns 0 when trialEndsAt is null', () => {
      service.trialEndsAt.set(null);
      expect(service.trialDaysRemaining()).toBe(0);
    });

    it('returns correct days for future trial end date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      service.trialEndsAt.set(futureDate);

      expect(service.trialDaysRemaining()).toBeGreaterThanOrEqual(29);
      expect(service.trialDaysRemaining()).toBeLessThanOrEqual(31);
    });

    it('returns 0 when trial has expired', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);
      service.trialEndsAt.set(pastDate);

      expect(service.trialDaysRemaining()).toBe(0);
    });

    it('rounds up partial days', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 25);
      service.trialEndsAt.set(futureDate);

      expect(service.trialDaysRemaining()).toBeGreaterThanOrEqual(1);
    });

    it('returns at least 1 when trial ends tomorrow', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(12, 0, 0, 0);
      service.trialEndsAt.set(tomorrow);

      expect(service.trialDaysRemaining()).toBeGreaterThanOrEqual(1);
      expect(service.trialDaysRemaining()).toBeLessThanOrEqual(2);
    });
  });

  describe('hasAccess computed', () => {
    it('returns true when accessStatus is trial', () => {
      service.accessStatus.set('trial');
      expect(service.hasAccess()).toBe(true);
    });

    it('returns true when accessStatus is active', () => {
      service.accessStatus.set('active');
      expect(service.hasAccess()).toBe(true);
    });

    it('returns false when accessStatus is expired', () => {
      service.accessStatus.set('expired');
      expect(service.hasAccess()).toBe(false);
    });

    it('returns false when accessStatus is none', () => {
      service.accessStatus.set('none');
      expect(service.hasAccess()).toBe(false);
    });
  });

  describe('createCheckout', () => {
    it('sets loading to true on call', () => {
      service.createCheckout().subscribe();
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/create-checkout`);
      req.flush({ url: 'https://payfast.co.za', data: {} });
    });

    it('sets loading to false on success', () => {
      service.createCheckout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/create-checkout`);
      req.flush({ url: 'https://payfast.co.za', data: {} });

      expect(service.loading()).toBe(false);
    });

    it('sets loading to false on error', () => {
      service.createCheckout().subscribe({
        error: () => {}
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/create-checkout`);
      req.error(new ErrorEvent('Network error'));

      expect(service.loading()).toBe(false);
    });

    it('returns observable with url and data', () => {
      const mockResponse = {
        url: 'https://sandbox.payfast.co.za/eng/process',
        data: { merchant_id: '123', signature: 'abc' }
      };

      let receivedResponse: any;
      service.createCheckout().subscribe(response => {
        receivedResponse = response;
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/create-checkout`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);

      expect(receivedResponse.url).toBe(mockResponse.url);
      expect(receivedResponse.data).toEqual(mockResponse.data);
    });

    it('makes POST request to correct endpoint', () => {
      service.createCheckout().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/create-checkout`);
      expect(req.request.method).toBe('POST');
      req.flush({ url: '', data: {} });
    });
  });

  describe('getStatus', () => {
    it('updates subscriptionStatus signal on success', () => {
      const mockResponse = {
        subscriptionStatus: 'active' as const,
        accessStatus: 'active' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.subscriptionStatus()).toBe('active');
    });

    it('updates subscriptionEndsAt signal on success', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);

      const mockResponse = {
        subscriptionStatus: 'active' as const,
        subscriptionEndsAt: futureDate.toISOString(),
        accessStatus: 'active' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.subscriptionEndsAt()).not.toBeNull();
      expect(service.subscriptionEndsAt()?.getMonth()).toBe(futureDate.getMonth());
    });

    it('updates trialEndsAt signal on success', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);

      const mockResponse = {
        subscriptionStatus: 'none' as const,
        trialEndsAt: futureDate.toISOString(),
        accessStatus: 'trial' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.trialEndsAt()).not.toBeNull();
    });

    it('updates accessStatus signal on success', () => {
      const mockResponse = {
        subscriptionStatus: 'none' as const,
        accessStatus: 'trial' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.accessStatus()).toBe('trial');
    });

    it('converts date strings to Date objects', () => {
      const dateString = '2026-02-15T12:00:00.000Z';

      const mockResponse = {
        subscriptionStatus: 'active' as const,
        subscriptionEndsAt: dateString,
        accessStatus: 'active' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.subscriptionEndsAt()).toBeInstanceOf(Date);
    });

    it('handles null dates correctly', () => {
      const mockResponse = {
        subscriptionStatus: 'none' as const,
        subscriptionEndsAt: null,
        trialEndsAt: null,
        accessStatus: 'none' as const
      };

      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      req.flush(mockResponse);

      expect(service.subscriptionEndsAt()).toBeNull();
      expect(service.trialEndsAt()).toBeNull();
    });

    it('makes GET request to correct endpoint', () => {
      service.getStatus().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/status`);
      expect(req.request.method).toBe('GET');
      req.flush({ subscriptionStatus: 'none', accessStatus: 'none' });
    });
  });

  describe('cancelSubscription', () => {
    it('sets loading to true on call', () => {
      service.cancelSubscription().subscribe();
      expect(service.loading()).toBe(true);

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/cancel`);
      req.flush({ message: 'Subscription canceled' });
    });

    it('sets loading to false on success', () => {
      service.cancelSubscription().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/cancel`);
      req.flush({ message: 'Subscription canceled' });

      expect(service.loading()).toBe(false);
    });

    it('updates subscriptionStatus to canceled on success', () => {
      service.subscriptionStatus.set('active');

      service.cancelSubscription().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/cancel`);
      req.flush({ message: 'Subscription canceled' });

      expect(service.subscriptionStatus()).toBe('canceled');
    });

    it('sets loading to false on error', () => {
      service.cancelSubscription().subscribe({ error: () => {} });

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/cancel`);
      req.error(new ErrorEvent('Network error'));

      expect(service.loading()).toBe(false);
    });

    it('makes POST request to correct endpoint', () => {
      service.cancelSubscription().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/subscriptions/cancel`);
      expect(req.request.method).toBe('POST');
      req.flush({ message: 'Subscription canceled' });
    });
  });

  describe('clearStatus', () => {
    it('resets subscriptionStatus to none', () => {
      service.subscriptionStatus.set('active');
      service.clearStatus();
      expect(service.subscriptionStatus()).toBe('none');
    });

    it('resets subscriptionEndsAt to null', () => {
      service.subscriptionEndsAt.set(new Date());
      service.clearStatus();
      expect(service.subscriptionEndsAt()).toBeNull();
    });

    it('resets trialEndsAt to null', () => {
      service.trialEndsAt.set(new Date());
      service.clearStatus();
      expect(service.trialEndsAt()).toBeNull();
    });

    it('resets accessStatus to none', () => {
      service.accessStatus.set('active');
      service.clearStatus();
      expect(service.accessStatus()).toBe('none');
    });
  });
});
