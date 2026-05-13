import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { verifyOTPHash, generateSessionToken } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours
const MAX_ATTEMPTS = 5;

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  const rl = checkRateLimit(`2fa:verify:${ip}`, MAX_ATTEMPTS, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many attempts. Please wait.' }, { status: 429 });
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

  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code || !/^\d{6}$/.test(code)) {
    return NextResponse.json({ error: 'Enter a 6-digit code.' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Verify still admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Fetch most recent valid code
  const { data: record } = await supabase
    .from('admin_2fa_codes')
    .select('id, otp_hash, expires_at, attempts')
    .eq('user_id', user.id)
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!record) {
    return NextResponse.json(
      { error: 'No valid code found. Please request a new code.' },
      { status: 400 }
    );
  }

  // Increment attempts
  await supabase
    .from('admin_2fa_codes')
    .update({ attempts: record.attempts + 1 })
    .eq('id', record.id);

  if (record.attempts >= MAX_ATTEMPTS) {
    await supabase.from('admin_2fa_codes').update({ used: true }).eq('id', record.id);
    return NextResponse.json(
      { error: 'Code expired due to too many attempts. Please request a new code.' },
      { status: 429 }
    );
  }

  if (!verifyOTPHash(code, record.otp_hash)) {
    return NextResponse.json({ error: 'Incorrect code.' }, { status: 400 });
  }

  // Mark code as used
  await supabase.from('admin_2fa_codes').update({ used: true }).eq('id', record.id);

  // Create 2FA session
  const sessionToken = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  // Clean up old sessions for this user
  await supabase.from('admin_2fa_sessions').delete().eq('user_id', user.id);

  await supabase.from('admin_2fa_sessions').insert({
    user_id: user.id,
    session_token: sessionToken,
    expires_at: expiresAt.toISOString(),
  });

  await writeAuditLog('admin.2fa_verified', 'admin', null, user.id, {}, ip);

  // Set HttpOnly session cookie
  const response = NextResponse.json({ success: true });
  response.cookies.set('eru_2fa_session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    expires: expiresAt,
    path: '/',
  });
  return response;
}
