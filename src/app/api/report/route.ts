import { NextRequest, NextResponse } from 'next/server';
import { createClient, createPublicClient } from '@/lib/supabase/server';
import { sanitizeText, checkRateLimit, getClientIp, isValidUUID } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';

const ALLOWED_TYPES = ['fake_listing', 'abusive_provider', 'other'] as const;
const ALLOWED_TARGET_TYPES = ['property', 'provider'] as const;

export async function POST(request: NextRequest) {
  // Rate limit: 3 reports per IP per hour (anonymous users especially)
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`report:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many reports submitted. Please try again later.' },
      { status: 429 }
    );
  }

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
  if (!target_id || typeof target_id !== 'string' || !isValidUUID(target_id)) {
    return NextResponse.json({ error: 'Invalid target_id' }, { status: 400 });
  }
  if (!reason || typeof reason !== 'string' || reason.trim() === '') {
    return NextResponse.json({ error: 'reason is required' }, { status: 400 });
  }

  const cleanReason  = sanitizeText(String(reason), 500);
  const cleanDetails = details ? sanitizeText(String(details), 2000) : null;

  // Get reporter identity if logged in (anonymous reports allowed)
  let reporterId: string | null = null;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    reporterId = user?.id ?? null;
  } catch { /* not authenticated — anonymous report is fine */ }

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

  await writeAuditLog('report.submitted', target_type as string, target_id, reporterId, { type, reason: cleanReason }, ip);

  return NextResponse.json({ success: true });
}
