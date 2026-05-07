import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import type { UserRole } from '@/types';

async function verifyAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return profile?.role === 'admin' ? user : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const body = await request.json() as { action: 'change_role' | 'deactivate' | 'reactivate'; role?: UserRole };
  const supabase = await createServiceRoleClient();

  if (body.action === 'change_role' && body.role) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: body.role })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.action === 'deactivate') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'deactivated' })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (body.action === 'reactivate') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: 'tenant' })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
