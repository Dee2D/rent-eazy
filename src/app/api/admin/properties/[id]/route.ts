import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { action } = await request.json() as { action: 'activate' | 'deactivate' | 'mark_taken' };

  const supabase = await createServiceRoleClient();

  if (action === 'activate') {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    const { error } = await supabase
      .from('properties')
      .update({ is_active: true, is_taken: false, expires_at: expiresAt.toISOString() })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === 'deactivate') {
    const { error } = await supabase
      .from('properties')
      .update({ is_active: false })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (action === 'mark_taken') {
    const { error } = await supabase
      .from('properties')
      .update({ is_active: false, is_taken: true })
      .eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

  return NextResponse.json({ success: true });
}
