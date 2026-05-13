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

/**
 * Validate coordinates are within Uganda's bounding box.
 * Lat: -1.5° to 4.25°N, Lng: 29.5° to 35.1°E
 */
export function isValidUgandaCoords(lat: number, lng: number): boolean {
  return lat >= -1.5 && lat <= 4.25 && lng >= 29.5 && lng <= 35.1;
}

/** Validate a Uganda phone number (MTN or Airtel format). */
export function isValidUgandaPhone(phone: string): boolean {
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  return /^(256[0-9]{9}|0[0-9]{9})$/.test(digits);
}

/** Security headers added to every response via middleware. */
export const SECURITY_HEADERS: Record<string, string> = {
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=(self)',
  'X-DNS-Prefetch-Control':    'on',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.mapbox.com https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://api.mapbox.com https://events.mapbox.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://api.resend.com https://challenges.cloudflare.com",
    "worker-src blob:",
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
  ].join('; '),
};

// ─── Cloudflare Turnstile CAPTCHA ─────────────────────────────────────────────

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true immediately when TURNSTILE_SECRET_KEY is not configured (dev mode).
 */
export async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // graceful degradation in dev / when not configured

  if (!token) return false;

  try {
    const body = new URLSearchParams({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    });
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    // Network error — fail open in dev, fail closed in prod
    return process.env.NODE_ENV !== 'production';
  }
}

// ─── Server-side MIME / magic bytes validation ────────────────────────────────

const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],
  'image/png':  [[0x89, 0x50, 0x4E, 0x47]],
  'image/webp': [[0x52, 0x49, 0x46, 0x46]], // RIFF....WEBP — first 4 bytes
};

/**
 * Validate the magic bytes of an image ArrayBuffer against the declared MIME type.
 * Prevents renamed executables from being uploaded as images.
 */
export function validateImageMagicBytes(buffer: ArrayBuffer, declaredMime: string): boolean {
  const allowed = MAGIC_BYTES[declaredMime];
  if (!allowed) return false;

  const bytes = new Uint8Array(buffer.slice(0, 12));
  return allowed.some((signature) =>
    signature.every((byte, i) => bytes[i] === byte)
  );
}

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
