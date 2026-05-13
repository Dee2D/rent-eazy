import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sanitizeText } from '@/lib/security';

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

// POST — send an inquiry about a property
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await params;
  const { user, supabase } = await getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { message?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const message = sanitizeText(body.message ?? '', 1000).trim();
  if (message.length < 10) {
    return NextResponse.json({ error: 'Message must be at least 10 characters' }, { status: 400 });
  }

  // Get landlord_id from the property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('landlord_id, title')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  if (property.landlord_id === user.id) {
    return NextResponse.json({ error: 'You cannot inquire about your own property' }, { status: 400 });
  }

  // Prevent spam — max 3 inquiries per property per tenant
  const { count } = await supabase
    .from('inquiries')
    .select('id', { count: 'exact', head: true })
    .eq('property_id', propertyId)
    .eq('tenant_id', user.id);

  if ((count ?? 0) >= 3) {
    return NextResponse.json({ error: 'You have already sent enough inquiries for this property' }, { status: 429 });
  }

  const { error } = await supabase.from('inquiries').insert({
    property_id: propertyId,
    tenant_id:   user.id,
    landlord_id: property.landlord_id,
    message,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
