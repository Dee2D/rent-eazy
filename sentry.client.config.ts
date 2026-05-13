import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

// Only initialize when DSN is configured — graceful no-op in dev/without Sentry account
if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,

    // Performance: sample 10% of transactions (adjust based on traffic volume)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    // Only sample 20% of replays on error — reduces quota usage
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0.2,

    // Never capture sensitive data
    beforeSend(event) {
      // Strip any accidentally captured passwords or tokens
      if (event.request?.data) {
        const data = event.request.data as Record<string, unknown>;
        const SENSITIVE = ['password', 'token', 'secret', 'otp', 'key', 'authorization'];
        SENSITIVE.forEach((key) => {
          if (data[key]) data[key] = '[REDACTED]';
        });
      }
      return event;
    },

    // Group errors by route for cleaner dashboards
    integrations: [
      Sentry.browserTracingIntegration(),
    ],

    // Ignore known browser extension noise
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'ChunkLoadError',
    ],
  });
}
