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
});

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
