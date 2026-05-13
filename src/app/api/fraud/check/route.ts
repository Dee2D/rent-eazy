import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { assessListing } from '@/lib/fraud';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  // Authenticate caller
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, description, priceUGX, district } = body as {
    title?: string;
    description?: string;
    priceUGX?: number;
    district?: string;
  };

  if (!title || !description || typeof priceUGX !== 'number') {
    return NextResponse.json({ error: 'title, description, priceUGX required' }, { status: 400 });
  }

  const signal = await assessListing({
    title,
    description,
    priceUGX,
    landlordId: user.id,
    district,
  });

  // Persist signal when score is notable
  if (signal.score >= 30) {
    const service = await createServiceRoleClient();
    await service.from('fraud_flags').insert({
      entity_type:  'listing',
      entity_id:    `draft:${user.id}:${Date.now()}`,
      fraud_score:  signal.score,
      flags:        signal.flags,
      action:       signal.action,
    });
  }

  return NextResponse.json(signal);
}
