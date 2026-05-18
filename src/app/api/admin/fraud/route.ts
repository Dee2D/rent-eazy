import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';
import { writeAuditLog } from '@/lib/audit';

// PATCH /api/admin/fraud — mark a flag reviewed + optional property action
export async function PATCH(req: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { flagId?: string; action?: 'approve' | 'reject'; propertyId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { flagId, action, propertyId } = body;
  if (!flagId || !action) {
    return NextResponse.json({ error: 'flagId and action required' }, { status: 400 });
  }

  const service = await createServiceRoleClient();

  // Mark the flag as reviewed
  const { error: flagErr } = await service
    .from('fraud_flags')
    .update({ reviewed: true, action })
    .eq('id', flagId);

  if (flagErr) return NextResponse.json({ error: flagErr.message }, { status: 500 });

  // Take action on the linked property (if given)
  if (propertyId && action === 'reject') {
    const { error: deleteErr } = await service
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 });
  }

  await writeAuditLog('admin.action', 'fraud_flag', flagId, admin.id, { action, propertyId });

  return NextResponse.json({ success: true });
}
