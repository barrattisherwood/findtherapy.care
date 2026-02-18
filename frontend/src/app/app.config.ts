import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER, ErrorHandler } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import * as Sentry from '@sentry/angular';

import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { errorInterceptor } from './interceptors/error.interceptor';
import { AnalyticsService } from './services/analytics.service';

function initializeAnalytics(analyticsService: AnalyticsService) {
  return () => analyticsService.init();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    ),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAnalytics,
      deps: [AnalyticsService],
      multi: true
    },
    // Sentry: capture unhandled Angular errors (template errors, zone errors, etc.)
    { provide: ErrorHandler, useValue: Sentry.createErrorHandler() },
    // Sentry: Angular router tracing for performance monitoring
    { provide: Sentry.TraceService, deps: [Router] },
    {
      provide: APP_INITIALIZER,
      useFactory: () => () => {},
      deps: [Sentry.TraceService],
      multi: true,
    },
  ]
};
