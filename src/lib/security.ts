// Allowed image MIME types — no SVG (can contain scripts)
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/** Strip HTML tags and control characters from user-supplied strings. */
export function sanitizeText(input: string, maxLength = 2000): string {
  return input
    .replace(/<[^>]*>/g, '')            // strip HTML tags
    .replace(/[<>&"']/g, (c) => ({      // escape remaining specials
      '<': '', '>': '', '&': '&', '"': '', "'": '',
    }[c] ?? c))
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
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
  if (password.length < 8)         return 'Password must be at least 8 characters.';
  if (!/[A-Z]/.test(password))     return 'Password must contain at least one uppercase letter.';
  if (!/[a-z]/.test(password))     return 'Password must contain at least one lowercase letter.';
  if (!/\d/.test(password))        return 'Password must contain at least one number.';
  return null;
}

/** Security headers added to every response via middleware. */
export const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options':           'DENY',
  'X-Content-Type-Options':    'nosniff',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'camera=(), microphone=(), geolocation=(self)',
  'X-DNS-Prefetch-Control':    'on',
  // CSP allows Supabase storage, Mapbox GL, and Resend tracking pixel
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
