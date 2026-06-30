import 'zone.js';
import * as Sentry from '@sentry/angular';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { environment } from './environments/environment';

Sentry.init({
  dsn: environment.sentryDsn,
  environment: environment.production ? 'production' : 'development',
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: false,
    }),
  ],
  // 20% of transactions in production to stay within free tier
  tracesSampleRate: environment.production ? 0.2 : 1.0,
  // Replay every session that has an error
  replaysOnErrorSampleRate: 1.0,
  // Record 5% of all sessions
  replaysSessionSampleRate: 0.05,
  // Only active if a DSN is configured
  enabled: !!environment.sentryDsn,
  beforeSend(event) {
    // Ignore errors injected by Facebook's in-app browser on Android.
    // "Java object is gone" is a WebView lifecycle error in Facebook's own
    // navigation_performance_logger_android script — not actionable.
    const msg = event.exception?.values?.[0]?.value ?? '';
    if (msg.includes('Java object is gone')) return null;

    const frames = event.exception?.values?.[0]?.stacktrace?.frames ?? [];
    if (frames.some(f => f.filename?.includes('iabjs://'))) return null;

    return event;
  },
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
