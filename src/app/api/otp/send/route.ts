import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { generateOTP, hashOTP } from '@/lib/otp';
import { checkRateLimit, getClientIp, isValidUgandaPhone } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Rate limit: 3 OTP sends per phone per 10 minutes
  const rl = checkRateLimit(`otp:send:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many OTP requests. Please wait before trying again.' },
      { status: 429 }
    );
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  if (!isValidUgandaPhone(phone)) {
    return NextResponse.json(
      { error: 'Enter a valid Uganda phone number (e.g. 0701234567 or +256701234567)' },
      { status: 400 }
    );
  }

  // Normalise to international format
  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  const normalised = digits.startsWith('256') ? `+${digits}` : `+256${digits.slice(1)}`;

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const supabase = await createServiceRoleClient();

  // Invalidate any previous unexpired OTP for this phone
  await supabase
    .from('phone_otps')
    .update({ verified: true }) // mark old as used
    .eq('phone', normalised)
    .eq('verified', false);

  const { error: insertErr } = await supabase.from('phone_otps').insert({
    phone: normalised,
    otp_hash: otpHash,
    expires_at: expiresAt.toISOString(),
  });

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to create OTP. Please try again.' }, { status: 500 });
  }

  // ── SMS integration point ─────────────────────────────────────────────────
  // Replace the console.info with your SMS provider:
  //
  // Africa's Talking (recommended for Uganda):
  //   POST https://api.africastalking.com/version1/messaging
  //   body: { username, to: normalised, message: `Your Rent Eazy code: ${otp}` }
  //
  // Vonage / Twilio are also supported for international coverage.
  // ─────────────────────────────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    console.info(`[OTP] Phone: ${normalised}  Code: ${otp}`);
  } else {
    // TODO: integrate Africa's Talking or similar
    console.info(`[OTP SMS] Would send to ${normalised}`);
  }

  await writeAuditLog('phone.otp_sent', 'phone', null, user.id, { phone: normalised }, ip);

  return NextResponse.json({ success: true, message: 'Verification code sent.' });
}
