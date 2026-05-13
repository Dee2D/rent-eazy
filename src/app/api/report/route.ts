import { NextRequest, NextResponse } from 'next/server';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { sanitizeText } from '@/lib/security';

const ALLOWED_TYPES = ['fake_listing', 'abusive_provider', 'other'] as const;
const ALLOWED_TARGET_TYPES = ['property', 'provider'] as const;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, target_id, target_type, reason, details } = body as Record<string, unknown>;

  if (!ALLOWED_TYPES.includes(type as typeof ALLOWED_TYPES[number])) {
    return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
  }
  if (!ALLOWED_TARGET_TYPES.includes(target_type as typeof ALLOWED_TARGET_TYPES[number])) {
    return NextResponse.json({ error: 'Invalid target type' }, { status: 400 });
  }
  if (!target_id || typeof target_id !== 'string' || target_id.trim() === '') {
    return NextResponse.json({ error: 'target_id is required' }, { status: 400 });
  }
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const cleanReason  = sanitizeText(String(reason), 500);
  const cleanDetails = details ? sanitizeText(String(details), 2000) : null;

  // Get reporter identity if logged in (optional — reports are allowed anonymously)
  let reporterId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    reporterId = user?.id ?? null;
  } catch { /* not authenticated — anonymous report */ }

  const supabase = createPublicClient();
  const { error } = await supabase.from('reports').insert({
    reporter_id: reporterId,
    type,
    target_id: target_id.trim(),
    target_type,
    reason: cleanReason,
    details: cleanDetails,
  });

  if (error) {
    return NextResponse.json({ error: 'Could not submit report. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
