export async function register() {
  // Only run in Node.js server runtime (not edge)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Capture uncaught request errors in Server Components / Route Handlers
export { captureRequestError as onRequestError } from '@sentry/nextjs';
