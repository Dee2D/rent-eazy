import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });

  try {
    const supabase = await createServiceRoleClient();
    const { data } = await supabase
      .from('properties')
      .select('view_count')
      .eq('id', id)
      .single();

    if (data) {
      await supabase
        .from('properties')
        .update({ view_count: (data.view_count ?? 0) + 1 })
        .eq('id', id);
    }
  } catch { /* silent — view tracking must never break page rendering */ }

  return NextResponse.json({ ok: true });
}
