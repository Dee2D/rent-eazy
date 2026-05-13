import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';
import { writeAuditLog } from '@/lib/audit';

const ALLOWED_ACTIONS = ['activate', 'deactivate', 'mark_taken'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { action } = await request.json() as { action: typeof ALLOWED_ACTIONS[number] };

  if (!ALLOWED_ACTIONS.includes(action)) {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  if (action === 'activate') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const { error } = await supabase
      .from('properties')
      .update({ is_active: true, is_taken: false, expires_at: expiresAt.toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('listing.activated', 'property', id, admin.id, { via: 'admin' });
  }

  if (action === 'deactivate') {
    const { error } = await supabase
      .from('properties')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('listing.deactivated', 'property', id, admin.id, { via: 'admin' });
  }

  if (action === 'mark_taken') {
    const { error } = await supabase
      .from('properties')
      .update({ is_active: false, is_taken: true })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('admin.action', 'property', id, admin.id, { action: 'mark_taken' });
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const supabase = await createServiceRoleClient();

  const { error } = await supabase.from('properties').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog('listing.deleted', 'property', id, admin.id, { via: 'admin' });
  return NextResponse.json({ success: true });
}
