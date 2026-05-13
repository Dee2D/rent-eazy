import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Called by Vercel Cron daily — hides providers whose trial has ended and have no active paid subscription
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization');
  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();
  const now = new Date().toISOString();

  // Find profiles whose trial has expired
  const { data: expiredProfiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id')
    .not('trial_end_date', 'is', null)
    .lte('trial_end_date', now);

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (!expiredProfiles || expiredProfiles.length === 0) {
    return NextResponse.json({ success: true, deactivated: 0 });
  }

  const expiredIds = expiredProfiles.map((p: { id: string }) => p.id);

  // Find their providers that are still visible but have no active paid subscription
  const { data: providers } = await supabase
    .from('service_providers')
    .select('id')
    .in('profile_id', expiredIds)
    .eq('is_visible', true);

  if (!providers || providers.length === 0) {
    return NextResponse.json({ success: true, deactivated: 0 });
  }

  let deactivated = 0;

  for (const provider of providers) {
    // Check if they have an active paid subscription (end_date in the future)
    const { data: activeSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('provider_id', provider.id)
      .eq('is_active', true)
      .gt('end_date', now)
      .maybeSingle();

    if (!activeSub) {
      await supabase
        .from('service_providers')
        .update({ is_visible: false })
        .eq('id', provider.id);
      deactivated++;
    }
  }

  // Mark expired trial profiles as inactive
  await supabase
    .from('profiles')
    .update({ is_trial_active: false })
    .in('id', expiredIds)
    .eq('is_trial_active', true);

  return NextResponse.json({
    success: true,
    deactivated,
    checked: providers.length,
    ran: new Date().toISOString(),
  });
}
