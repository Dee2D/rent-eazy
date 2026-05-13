import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, verifyTurnstile } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';

const AUTH_ERROR_MAP: Record<string, string> = {
  'Invalid login credentials': 'Incorrect email or password.',
  'Email not confirmed': 'Please confirm your email before signing in.',
  'Too many requests': 'Too many sign-in attempts. Please wait a few minutes.',
  'User not found': 'Incorrect email or password.',
};

function normalizeAuthError(msg: string): string {
  for (const [key, friendly] of Object.entries(AUTH_ERROR_MAP)) {
    if (msg.includes(key)) return friendly;
  }
  return 'Sign-in failed. Please check your credentials and try again.';
}

async function isIPBlocked(ip: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  const supabase = createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data } = await supabase
    .from('blocked_ips')
    .select('expires_at')
    .eq('ip_address', ip)
    .maybeSingle();

  if (!data) return false;
  if (!data.expires_at) return true; // permanent block
  return new Date(data.expires_at) > new Date();
}

async function logLoginAttempt(opts: {
  userId: string | null;
  email: string;
  ip: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  const supabase = createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  await supabase.from('login_logs').insert({
    user_id:        opts.userId,
    email:          opts.email,
    ip_address:     opts.ip,
    user_agent:     opts.userAgent,
    success:        opts.success,
    failure_reason: opts.failureReason ?? null,
  });
}

async function detectSuspiciousActivity(ip: string, email: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  const supabase = createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // last 1 hour

  // Count failed logins from this IP in the last hour
  const { count: failedFromIP } = await supabase
    .from('login_logs')
    .select('*', { count: 'exact', head: true })
    .eq('ip_address', ip)
    .eq('success', false)
    .gte('created_at', since);

  if ((failedFromIP ?? 0) >= 10) return true;

  // Count distinct emails attempted from this IP (multiple accounts from one IP)
  const { data: ipAttempts } = await supabase
    .from('login_logs')
    .select('email')
    .eq('ip_address', ip)
    .gte('created_at', since);

  const distinctEmails = new Set(ipAttempts?.map((r) => r.email) ?? []).size;
  if (distinctEmails >= 5) return true;

  return false;
}

export async function POST(request: NextRequest) {
  const ip        = getClientIp(request.headers);
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  // Rate limit: 10 login attempts per IP per 15 minutes
  const rl = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many sign-in attempts. Please wait before trying again.' },
      { status: 429 }
    );
  }

  // Check if this IP is blocked
  if (await isIPBlocked(ip)) {
    await writeAuditLog('login.blocked', 'auth', null, null, { ip, reason: 'ip_blocked' });
    return NextResponse.json(
      { error: 'Access denied. Please contact support.' },
      { status: 403 }
    );
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email    = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
  }

  // Verify Turnstile CAPTCHA (no-op when keys not configured)
  const captchaOk = await verifyTurnstile(turnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
  }

  // Detect suspicious activity before auth (brute-force from this IP/email)
  const suspicious = await detectSuspiciousActivity(ip, email);
  if (suspicious) {
    await writeAuditLog('login.blocked', 'auth', null, null, { ip, email, reason: 'suspicious_activity' });
    return NextResponse.json(
      { error: 'Too many failed attempts from your location. Please try again later.' },
      { status: 429 }
    );
  }

  // ── Authenticate via Supabase SSR (sets session cookies on the response) ──
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const cookiesToSet: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];
  const response = NextResponse.json({ success: false }); // placeholder — replaced below

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll:  () => request.cookies.getAll(),
      setAll: (cs) => { cs.forEach((c) => cookiesToSet.push(c)); },
    },
  });

  const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError || !data.user) {
    const reason = authError?.message ?? 'unknown';
    await logLoginAttempt({ userId: null, email, ip, userAgent, success: false, failureReason: reason });
    await writeAuditLog('login.failed', 'auth', null, null, { ip, email, reason });
    return NextResponse.json({ error: normalizeAuthError(reason) }, { status: 401 });
  }

  // Successful login — fetch role
  const svcSupabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: profile } = await svcSupabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();

  await logLoginAttempt({ userId: data.user.id, email, ip, userAgent, success: true });
  await writeAuditLog('login.success', 'auth', null, data.user.id, { ip });

  // Build response and forward cookies set by Supabase SSR
  const finalResponse = NextResponse.json({
    success: true,
    role: profile?.role ?? 'tenant',
  });

  cookiesToSet.forEach(({ name, value, options }) => {
    finalResponse.cookies.set(name, value, options as Parameters<typeof finalResponse.cookies.set>[2]);
  });

  return finalResponse;
}
