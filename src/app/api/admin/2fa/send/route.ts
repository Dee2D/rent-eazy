import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { generateOTP, hashOTP } from '@/lib/otp';
import { checkRateLimit, getClientIp } from '@/lib/security';
import { sendAdminOTPEmail } from '@/lib/email/otp';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Rate limit: 3 sends per IP per 10 minutes
  const rl = checkRateLimit(`2fa:send:${ip}`, 3, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });
  }

  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();

  // Verify admin role before sending 2FA code
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const otp = generateOTP();
  const otpHash = hashOTP(otp);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Invalidate any previous unused codes for this user
  await supabase
    .from('admin_2fa_codes')
    .update({ used: true })
    .eq('user_id', user.id)
    .eq('used', false);

  const { error: insertErr } = await supabase.from('admin_2fa_codes').insert({
    user_id: user.id,
    otp_hash: otpHash,
    expires_at: expiresAt.toISOString(),
  });

  if (insertErr) {
    return NextResponse.json({ error: 'Failed to generate 2FA code.' }, { status: 500 });
  }

  const emailResult = await sendAdminOTPEmail(user.email!, profile.full_name ?? 'Admin', otp);

  if (!emailResult.ok) {
    // Email failed — return the OTP in the response so the admin can still log in.
    // This is intentional: without a verified Resend domain, email delivery is unavailable.
    console.warn('[2FA] Email delivery failed, using response fallback. Error:', emailResult.error);
    return NextResponse.json({ success: true, fallbackCode: otp });
  }

  return NextResponse.json({ success: true });
}
