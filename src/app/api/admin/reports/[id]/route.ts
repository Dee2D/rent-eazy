import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

const ALLOWED_STATUSES = ['reviewed', 'resolved', 'dismissed'] as const;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { id } = await params;
  const { status } = await request.json() as { status: string };

  if (!ALLOWED_STATUSES.includes(status as typeof ALLOWED_STATUSES[number])) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();
  const { error } = await supabase
    .from('reports')
    .update({ status })
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
