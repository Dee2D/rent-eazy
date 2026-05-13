import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceRoleClient } from '@/lib/supabase/server';

async function getAdminUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  return profile?.role === 'admin' ? user : null;
}

// PATCH /api/admin/fraud — mark a flag reviewed + optional property action
export async function PATCH(req: NextRequest) {
  const adminUser = await getAdminUser();
  if (!adminUser) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

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
  await service
    .from('fraud_flags')
    .update({ reviewed: true, action })
    .eq('id', flagId);

  // Take action on the linked property (if given)
  if (propertyId) {
    if (action === 'approve') {
      // Leave the property as-is (payment still required to activate)
    } else if (action === 'reject') {
      await service.from('properties').delete().eq('id', propertyId);
    }
  }

  return NextResponse.json({ success: true });
}
