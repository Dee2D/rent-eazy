import { NextRequest, NextResponse } from 'next/server';
import { trackProviderAnalytics } from '@/lib/supabase/providers';
import { isValidUUID } from '@/lib/security';

// POST /api/provider/analytics — fire-and-forget event tracking (no auth required)
export async function POST(req: NextRequest) {
  let body: { providerId?: unknown; eventType?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // always 200 — analytics must never block UX
  }

  const { providerId, eventType } = body;

  if (
    typeof providerId === 'string' &&
    isValidUUID(providerId) &&
    (eventType === 'profile_view' || eventType === 'whatsapp_click' || eventType === 'call_click')
  ) {
    // Non-awaited fire-and-forget — client gets response immediately
    trackProviderAnalytics(providerId, eventType as 'profile_view' | 'whatsapp_click' | 'call_click');
  }

  return NextResponse.json({ ok: true });
}
