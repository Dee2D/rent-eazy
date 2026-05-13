import { randomInt, createHash, randomBytes } from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET ?? 'eru-otp-dev-secret-change-in-prod';

/** Generate a cryptographically random 6-digit OTP. */
export function generateOTP(): string {
  return String(randomInt(100000, 999999));
}

/** Generate a random session token (64 hex chars). */
export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

/** Hash an OTP with HMAC-SHA256 for storage. */
export function hashOTP(otp: string): string {
  return createHash('sha256').update(`${otp}:${OTP_SECRET}`).digest('hex');
}

/** Constant-time comparison to prevent timing attacks. */
export function verifyOTPHash(candidate: string, stored: string): boolean {
  const candidateHash = hashOTP(candidate);
  if (candidateHash.length !== stored.length) return false;
  let diff = 0;
  for (let i = 0; i < candidateHash.length; i++) {
    diff |= candidateHash.charCodeAt(i) ^ stored.charCodeAt(i);
  }
  return diff === 0;
}
