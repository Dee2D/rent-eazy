import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { verifyOTPHash } from '@/lib/otp';
import { checkRateLimit, getClientIp, isValidUgandaPhone } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';

const MAX_VERIFY_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Rate limit: 5 verification attempts per IP per 15 minutes
  const rl = checkRateLimit(`otp:verify:${ip}`, MAX_VERIFY_ATTEMPTS, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many verification attempts. Please request a new code.' },
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
  const code  = typeof body.code  === 'string' ? body.code.trim()  : '';

  if (!isValidUgandaPhone(phone) || !code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid phone number or code format.' }, { status: 400 });
  }

  const digits = phone.replace(/[\s\-\+\(\)]/g, '');
  const normalised = digits.startsWith('256') ? `+${digits}` : `+256${digits.slice(1)}`;

  const supabase = await createServiceRoleClient();

  // Fetch most recent unexpired, unverified OTP for this phone
  const { data: record } = await supabase
    .from('phone_otps')
    .select('id, otp_hash, expires_at, attempts')
    .eq('phone', normalised)
    .eq('verified', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return NextResponse.json(
      { error: 'No valid code found. Please request a new one.' },
      { status: 400 }
    );
  }

  // Increment attempt count
  await supabase
    .from('phone_otps')
    .update({ attempts: record.attempts + 1 })
    .eq('id', record.id);

  if (record.attempts >= MAX_VERIFY_ATTEMPTS) {
    await supabase.from('phone_otps').update({ verified: true }).eq('id', record.id);
    return NextResponse.json(
      { error: 'Too many incorrect attempts. Please request a new code.' },
      { status: 429 }
    );
  }

  if (!verifyOTPHash(code, record.otp_hash)) {
    return NextResponse.json({ error: 'Incorrect code. Please try again.' }, { status: 400 });
  }

  // Mark OTP as used
  await supabase.from('phone_otps').update({ verified: true }).eq('id', record.id);

  // Update user profile: set phone_number + phone_verified
  await supabase
    .from('profiles')
    .update({ phone_number: normalised, phone_verified: true })
    .eq('id', user.id);

  await writeAuditLog('phone.verified', 'phone', null, user.id, { phone: normalised }, ip);

  return NextResponse.json({ success: true, message: 'Phone number verified.' });
}
