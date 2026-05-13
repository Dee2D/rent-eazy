import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkRateLimit, getClientIp, isValidUUID } from '@/lib/security';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id || !isValidUUID(id)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Rate limit: 1 view per IP per property per 30 minutes
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`view:${ip}:${id}`, 1, 30 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json({ ok: true }); // silent — don't tell scrapers they're blocked
  }

  try {
    const supabase = await createServiceRoleClient();
    // Atomic increment — no read-modify-write race condition
    await supabase.rpc('increment_property_view_count', { property_id: id });
  } catch {
    // View tracking must never break page rendering
  }

  return NextResponse.json({ ok: true });
}
