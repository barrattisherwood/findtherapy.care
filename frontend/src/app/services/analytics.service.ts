import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { environment } from '../../environments/environment';

declare global {
  interface Window {
    gtag?: (command: string, ...args: any[]) => void;
    dataLayer?: any[];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private router = inject(Router);
  private initialized = false;

  init(): void {
    if (!environment.gaTrackingId || this.initialized) {
      return;
    }

    // Initialize GA4
    if (window.gtag) {
      window.gtag('config', environment.gaTrackingId, {
        send_page_view: false // We'll manually send page views
      });
      this.initialized = true;

      // Track page views on navigation
      this.router.events.pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd)
      ).subscribe((event: NavigationEnd) => {
        this.trackPageView(event.urlAfterRedirects);
      });
    }
  }

  trackPageView(path: string): void {
    if (!this.initialized || !window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_location: window.location.href,
      page_title: document.title
    });
  }

  trackEvent(eventName: string, params?: { [key: string]: any }): void {
    if (!this.initialized || !window.gtag) return;

    window.gtag('event', eventName, params);
  }

  // Convenience methods for common events
  trackProviderView(providerId: string, providerName: string): void {
    this.trackEvent('view_provider', {
      provider_id: providerId,
      provider_name: providerName
    });
  }

  trackContactFormSubmit(providerId: string, providerName: string): void {
    this.trackEvent('contact_provider', {
      provider_id: providerId,
      provider_name: providerName
    });
  }

  trackSiteContactSubmit(): void {
    this.trackEvent('contact_site');
  }

  trackSearch(specialties: string[], city: string, type?: string, freeConsultation?: boolean): void {
    this.trackEvent('search', {
      specialty: specialties.join(', ') || undefined,
      city: city || undefined,
      provider_type: type,
      free_consultation: freeConsultation
    });
  }

  trackRegistration(userType: 'provider' | 'user'): void {
    this.trackEvent('sign_up', {
      method: 'email',
      user_type: userType
    });
  }

  trackLogin(): void {
    this.trackEvent('login', {
      method: 'email'
    });
  }

  trackSubscriptionStart(plan: string): void {
    this.trackEvent('begin_checkout', {
      item_name: plan,
      item_category: 'subscription'
    });
  }

  trackSubscriptionComplete(plan: string): void {
    this.trackEvent('purchase', {
      transaction_id: Date.now().toString(),
      item_name: plan,
      item_category: 'subscription'
    });
  }
}
