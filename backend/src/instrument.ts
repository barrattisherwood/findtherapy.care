import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  // Capture 20% of transactions in production to stay within free tier
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  // Only initialise if a DSN is configured
  enabled: !!process.env.SENTRY_DSN,
  integrations: [
    Sentry.mongooseIntegration(),
    Sentry.expressIntegration(),
  ],
});
