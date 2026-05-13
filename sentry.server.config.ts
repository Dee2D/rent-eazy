import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

    beforeSend(event) {
      // Strip sensitive fields before sending to Sentry
      if (event.request?.headers) {
        const hdrs = event.request.headers as Record<string, unknown>;
        delete hdrs['authorization'];
        delete hdrs['cookie'];
        delete hdrs['x-supabase-key'];
      }
      return event;
    },
  });
}
