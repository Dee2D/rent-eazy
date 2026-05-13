import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { checkRateLimit, getClientIp, verifyTurnstile, sanitizeText, validatePassword } from '@/lib/security';
import type { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);

  // Rate limit: 5 registrations per IP per hour
  const rl = checkRateLimit(`register:${ip}`, 5, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      { status: 429 }
    );
  }

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const email          = typeof body.email    === 'string' ? body.email.trim().toLowerCase() : '';
  const password       = typeof body.password === 'string' ? body.password : '';
  const fullName       = typeof body.fullName === 'string' ? body.fullName : '';
  const phone          = typeof body.phone    === 'string' ? body.phone : '';
  const role           = typeof body.role     === 'string' ? body.role as UserRole : 'tenant';
  const acceptedTerms  = body.acceptedTerms === true;
  const acceptedTermsAt = typeof body.acceptedTermsAt === 'string' ? body.acceptedTermsAt : new Date().toISOString();
  const turnstileToken  = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }
  if (!acceptedTerms) {
    return NextResponse.json({ error: 'You must accept the Terms & Conditions.' }, { status: 400 });
  }
  if (!['tenant', 'landlord', 'provider'].includes(role)) {
    return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
  }

  const pwError = validatePassword(password);
  if (pwError) return NextResponse.json({ error: pwError }, { status: 400 });

  // Verify Turnstile CAPTCHA
  const captchaOk = await verifyTurnstile(turnstileToken, ip);
  if (!captchaOk) {
    return NextResponse.json({ error: 'CAPTCHA verification failed. Please try again.' }, { status: 400 });
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name:        sanitizeText(fullName, 100),
        phone_number:     phone || null,
        role,
        accepted_terms:   true,
        accepted_terms_at: acceptedTermsAt,
      },
    },
  });

  if (signUpError || !data.user) {
    return NextResponse.json({ error: signUpError?.message ?? 'Registration failed.' }, { status: 400 });
  }

  return NextResponse.json({ success: true, requiresConfirmation: !data.session });
}
