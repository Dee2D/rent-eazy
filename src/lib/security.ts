// Allowed image MIME types — no SVG (can contain scripts)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Strip HTML tags and control characters from user-supplied strings before DB storage.
 * Does NOT HTML-encode entities — React's JSX handles output escaping automatically.
 * Only used for text destined for plain-text DB columns, not for HTML rendering.
 */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/<[^>]*>/g, '')                        // strip all HTML tags
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control characters
    .trim()
    .slice(0, maxLength);
}

/** Validate a file before upload. Returns an error string or null. */
export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
    return 'Only JPG, PNG, and WebP images are allowed.';
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `File "${file.name}" exceeds the 5 MB limit.`;
  }
  return null;
}

/** Validate password meets minimum requirements. Returns error string or null. */
export function validatePassword(password: string): string | null {
  if (password.length < 8)       return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password))   return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password))   return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password))      return 'Password must contain at least one number.';
  return null;
}

/** Validate a UUID v4 string. Prevents injection via ID parameters. */
export function isValidUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

/** Security headers added to every response via middleware. */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options':        'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy':        'strict-origin-when-cross-origin',
  'Permissions-Policy':     'camera=(), microphone=(), geolocation=(self)',
  'X-DNS-Prefetch-Control': 'on',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com",
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://api.resend.com",
    "worker-src blob:",
    "frame-ancestors 'none'",
  ].join('; '),
};

// ─── In-process rate limiter ──────────────────────────────────────────────────
// Per Vercel serverless instance. Sufficient for basic abuse prevention.
// For high-traffic production, replace with Vercel KV or Upstash Redis.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Probabilistic cleanup (~1% of requests) to avoid unbounded memory growth
  if (Math.random() < 0.01) {
    for (const [k, v] of rateLimitStore) {
      if (v.resetAt < now) rateLimitStore.delete(k);
    }
  }

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1, resetAt: now + windowMs };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
}

/** Extract a best-effort client IP from Next.js request headers. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}
