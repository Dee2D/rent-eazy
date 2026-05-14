import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { SECURITY_HEADERS } from '@/lib/security';

function withSecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}

/** Verify admin 2FA session token against the DB (service role, no cookies). */
async function verifyAdmin2FASession(token: string, userId: string): Promise<boolean> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return false;

  try {
    const supabase = createSupabaseClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data } = await supabase
      .from('admin_2fa_sessions')
      .select('user_id, expires_at')
      .eq('session_token', token)
      .single();

    return (
      !!data &&
      data.user_id === userId &&
      new Date(data.expires_at) > new Date()
    );
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const { pathname } = request.nextUrl;

  const isProtected  = pathname.startsWith('/dashboard') || pathname.startsWith('/admin');
  const isAdminRoute = pathname.startsWith('/admin');
  const is2FAPage    = pathname.startsWith('/admin/verify-2fa');

  if (!supabaseUrl || !supabaseKey) {
    if (isProtected) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return withSecurityHeaders(NextResponse.next({ request }));
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll(); },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  // Unauthenticated: redirect to login for protected routes
  if (!user && isProtected) {
    return withSecurityHeaders(NextResponse.redirect(new URL('/login', request.url)));
  }

  if (user && isAdminRoute) {
    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return withSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
    }

    // Skip 2FA check on the 2FA page itself (prevent redirect loop)
    if (!is2FAPage) {
      const sessionToken = request.cookies.get('eru_2fa_session')?.value ?? '';
      const valid = sessionToken
        ? await verifyAdmin2FASession(sessionToken, user.id)
        : false;

      if (!valid) {
        const url = new URL('/admin/verify-2fa', request.url);
        url.searchParams.set('redirect', pathname);
        return withSecurityHeaders(NextResponse.redirect(url));
      }
    }
  }

  return withSecurityHeaders(supabaseResponse);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)'],
};
