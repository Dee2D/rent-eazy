import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { sendTrialReminderEmail } from '@/lib/email/trial-reminder';

// Runs daily at 08:00 UTC (11:00 EAT).
// Sends one reminder email to users whose trial ends in the next 24-hour window
// starting 14 days from now. Because trial_end_date is a fixed timestamp per user,
// a given user falls in this window exactly once, so no dedup column is needed.
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization');
  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();

  // 14-day window: trial_end_date is between [now+14d, now+15d)
  const windowStart = new Date();
  windowStart.setDate(windowStart.getDate() + 14);

  const windowEnd = new Date();
  windowEnd.setDate(windowEnd.getDate() + 15);

  const { data: profiles, error: profileErr } = await supabase
    .from('profiles')
    .select('id, full_name, trial_end_date')
    .eq('is_trial_active', true)
    .gte('trial_end_date', windowStart.toISOString())
    .lt('trial_end_date', windowEnd.toISOString());

  if (profileErr) {
    return NextResponse.json({ error: profileErr.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ success: true, sent: 0, ran: new Date().toISOString() });
  }

  const profileIds = profiles.map((p: { id: string }) => p.id);

  // Check which of these profiles have properties or providers
  const [{ data: propertyOwners }, { data: providerOwners }] = await Promise.all([
    supabase
      .from('properties')
      .select('landlord_id')
      .in('landlord_id', profileIds)
      .eq('is_active', true),
    supabase
      .from('service_providers')
      .select('profile_id')
      .in('profile_id', profileIds)
      .eq('is_visible', true),
  ]);

  const propertyOwnerSet = new Set((propertyOwners ?? []).map((r: { landlord_id: string }) => r.landlord_id));
  const providerOwnerSet = new Set((providerOwners ?? []).map((r: { profile_id: string }) => r.profile_id));

  let sent = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const profile of profiles as { id: string; full_name: string; trial_end_date: string }[]) {
    const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(profile.id);

    if (userErr || !user?.email) {
      failed++;
      continue;
    }

    const trialEndDate = new Date(profile.trial_end_date);
    const daysLeft = Math.ceil((trialEndDate.getTime() - Date.now()) / 86400000);

    const result = await sendTrialReminderEmail({
      name: profile.full_name || 'there',
      email: user.email,
      trialEndDate,
      daysLeft,
      hasProperty: propertyOwnerSet.has(profile.id),
      hasProvider: providerOwnerSet.has(profile.id),
    });

    if (result.success) {
      sent++;
    } else {
      failed++;
      errors.push(`${user.email}: ${result.error}`);
    }
  }

  return NextResponse.json({
    success: true,
    sent,
    failed,
    ...(errors.length > 0 && { errors }),
    ran: new Date().toISOString(),
  });
}
