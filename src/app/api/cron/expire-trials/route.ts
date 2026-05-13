import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

/**
 * Daily cron at 02:00 UTC.
 *
 * 1. Deactivate service providers whose trial has expired and have no paid subscription.
 *    Uses a single JOIN query instead of a per-provider loop (eliminates N+1).
 * 2. Deactivate expired property listings.
 * 3. Mark trial profiles as inactive.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization');
  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();
  const now = new Date().toISOString();

  // ── Step 1: Find providers to deactivate in a single query ──────────────────
  // Providers are deactivated when:
  //   - Their profile's trial has expired, AND
  //   - They have no active paid subscription
  const { data: providersToDeactivate, error: provErr } = await supabase
    .from('service_providers')
    .select('id, profile_id, profiles!inner(trial_end_date)')
    .eq('is_visible', true)
    .lte('profiles.trial_end_date', now) as { data: Array<{ id: string; profile_id: string }> | null; error: unknown };

  if (provErr) {
    return NextResponse.json({ error: 'Failed to query providers' }, { status: 500 });
  }

  let deactivatedProviders = 0;

  if (providersToDeactivate && providersToDeactivate.length > 0) {
    const providerIds = providersToDeactivate.map((p) => p.id);

    // Exclude providers with active paid subscriptions
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('provider_id')
      .in('provider_id', providerIds)
      .eq('is_active', true)
      .gt('end_date', now);

    const activeSubIds = new Set((activeSubs ?? []).map((s: { provider_id: string }) => s.provider_id));
    const toDeactivate = providerIds.filter((id) => !activeSubIds.has(id));

    if (toDeactivate.length > 0) {
      const { error: deactErr } = await supabase
        .from('service_providers')
        .update({ is_visible: false })
        .in('id', toDeactivate);

      if (!deactErr) deactivatedProviders = toDeactivate.length;
    }
  }

  // ── Step 2: Deactivate expired property listings ─────────────────────────────
  const { error: listingErr, data: expiredListingData } = await supabase
    .from('properties')
    .update({ is_active: false })
    .eq('is_active', true)
    .lt('expires_at', now)
    .select('id');
  const expiredListings = expiredListingData?.length ?? 0;

  if (listingErr) {
    console.error('[cron/expire-trials] Listing deactivation error:', listingErr.message);
  }

  // ── Step 3: Mark trial profiles as inactive ───────────────────────────────────
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ is_trial_active: false })
    .eq('is_trial_active', true)
    .lte('trial_end_date', now);

  if (profileErr) {
    console.error('[cron/expire-trials] Profile trial update error:', profileErr.message);
  }

  return NextResponse.json({
    success: true,
    deactivatedProviders,
    expiredListings: expiredListings ?? 0,
    ran: now,
  });
}
