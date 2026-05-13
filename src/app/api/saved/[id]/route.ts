import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function getUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  return { user, supabase };
}

// GET — check if a property is saved
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ saved: false });

  const { data } = await supabase
    .from('saved_properties')
    .select('property_id')
    .eq('user_id', user.id)
    .eq('property_id', propertyId)
    .maybeSingle();

  return NextResponse.json({ saved: !!data });
}

// POST — save a property
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { error } = await supabase
    .from('saved_properties')
    .insert({ user_id: user.id, property_id: propertyId });

  if (error && error.code !== '23505') {   // ignore duplicate
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ saved: true });
}

// DELETE — unsave a property
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: propertyId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await supabase
    .from('saved_properties')
    .delete()
    .eq('user_id', user.id)
    .eq('property_id', propertyId);

  return NextResponse.json({ saved: false });
}
