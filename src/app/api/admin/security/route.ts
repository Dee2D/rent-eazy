import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { blockIP, unblockIP } from '@/lib/supabase/admin';
import { writeAuditLog } from '@/lib/audit';
import { getClientIp } from '@/lib/security';

async function verifyAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const svc = await createServiceRoleClient();
  const { data: profile } = await svc
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

/** POST /api/admin/security — block or unblock an IP */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request.headers);
  const user = await verifyAdminUser();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const action    = typeof body.action    === 'string' ? body.action : '';
  const ipAddress = typeof body.ipAddress === 'string' ? body.ipAddress.trim() : '';
  const reason    = typeof body.reason    === 'string' ? body.reason.trim() : 'Blocked by admin';
  const expiresAt = typeof body.expiresAt === 'string' ? body.expiresAt : undefined;

  if (!ipAddress) {
    return NextResponse.json({ error: 'ipAddress is required.' }, { status: 400 });
  }
  if (!['block', 'unblock'].includes(action)) {
    return NextResponse.json({ error: 'action must be "block" or "unblock".' }, { status: 400 });
  }

  if (action === 'block') {
    await blockIP(ipAddress, reason, user.id, expiresAt);
    await writeAuditLog('admin.ip_blocked', 'ip', null, user.id, { ipAddress, reason }, ip);
    return NextResponse.json({ success: true, message: `IP ${ipAddress} blocked.` });
  } else {
    await unblockIP(ipAddress);
    await writeAuditLog('admin.ip_unblocked', 'ip', null, user.id, { ipAddress }, ip);
    return NextResponse.json({ success: true, message: `IP ${ipAddress} unblocked.` });
  }
}
