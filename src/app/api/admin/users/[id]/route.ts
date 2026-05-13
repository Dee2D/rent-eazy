import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';
import { writeAuditLog } from '@/lib/audit';
import type { UserRole } from '@/types';

const ALLOWED_ROLES: UserRole[] = ['tenant', 'landlord', 'provider', 'admin'];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const body = await request.json() as { action: 'change_role' | 'deactivate' | 'reactivate' | 'ban'; role?: UserRole };
  const supabase = await createServiceRoleClient();

  if (body.action === 'change_role') {
    if (!body.role || !ALLOWED_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
    const { error } = await supabase
      .from('profiles')
      .update({ role: body.role })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('user.role_changed', 'profile', id, admin.id, { newRole: body.role });
  }

  if (body.action === 'deactivate') {
    // Soft-deactivate by setting role to a non-functional value
    // Note: Supabase Auth account remains — only platform access is blocked via role check
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'deactivated' as UserRole })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('user.deactivated', 'profile', id, admin.id);
  }

  if (body.action === 'reactivate') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'tenant' })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('user.reactivated', 'profile', id, admin.id);
  }

  if (body.action === 'ban') {
    // Deactivate profile AND pull all their listings immediately
    await Promise.all([
      supabase.from('profiles').update({ role: 'deactivated' as UserRole }).eq('id', id),
      supabase.from('properties').update({ is_active: false }).eq('landlord_id', id),
    ]);
    await writeAuditLog('user.banned', 'profile', id, admin.id);
  }

  return NextResponse.json({ success: true });
}
