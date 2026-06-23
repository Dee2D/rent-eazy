import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendWelcomeEmail } from '@/lib/email/welcome';
import type { UserRole } from '@/types';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // After the code exchange, a session exists. Create the profile from the
      // metadata stored during signUp if it hasn't been created yet (this handles
      // the email-confirmation flow where the client couldn't insert the profile
      // because there was no session at signup time).
      const { data: { user } } = await supabase.auth.getUser();
      const meta = user?.user_metadata;

      if (user && meta?.full_name) {
        const trialStart = new Date();
        const trialEnd = new Date(trialStart);
        trialEnd.setMonth(trialEnd.getMonth() + 3);

        const { data: upsertResult } = await supabase.from('profiles').upsert(
          {
            id: user.id,
            full_name: meta.full_name,
            phone_number: meta.phone_number ?? null,
            role: meta.role ?? 'tenant',
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            is_trial_active: true,
            accepted_terms: meta.accepted_terms === true,
            accepted_terms_at: meta.accepted_terms_at ?? null,
          },
          { onConflict: 'id', ignoreDuplicates: true }
        ).select().maybeSingle();

        // Send welcome email only on first profile creation (ignoreDuplicates means
        // the upsert returns null data when the row already existed)
        if (upsertResult && user.email) {
          sendWelcomeEmail({
            name: meta.full_name,
            email: user.email,
            role: (meta.role ?? 'tenant') as UserRole,
          }); // fire-and-forget — never await
        }
      }

      // Validate next is a safe relative path — prevent open redirect via //evil.com
      const safeNext = /^\/[^/]/.test(next) ? next : '/dashboard';
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
