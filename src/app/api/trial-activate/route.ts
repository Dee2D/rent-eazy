import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { checkTrialStatus } from '@/lib/supabase/trial';
import { isValidUUID } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';
import type { PaymentType } from '@/types';

export async function POST(request: NextRequest) {
  // Authenticate — must be logged in to activate trial benefits
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: { type?: unknown; referenceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type, referenceId } = body;

  if (!type || !referenceId) {
    return NextResponse.json({ error: 'Missing required fields: type, referenceId' }, { status: 400 });
  }
  if (!['listing', 'subscription'].includes(type as string)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  }
  if (!isValidUUID(referenceId as string)) {
    return NextResponse.json({ error: 'Invalid referenceId format' }, { status: 400 });
  }

  const supabase = await createServiceRoleClient();

  // Read profile for the authenticated user — never trust a userId from the client
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, trial_end_date, is_trial_active')
    .eq('id', user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  const trial = checkTrialStatus(profile.trial_end_date);
  if (!trial.isOnTrial) {
    return NextResponse.json({ error: 'Your trial has expired — payment is required.' }, { status: 403 });
  }

  if (type === 'listing') {
    // Ownership check: the property must belong to the authenticated user
    const { data: existing } = await supabase
      .from('properties')
      .select('landlord_id, is_active, expires_at')
      .eq('id', referenceId as string)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (existing.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Idempotency
    if (existing.is_active && existing.expires_at && new Date(existing.expires_at) > new Date()) {
      return NextResponse.json({ success: true });
    }

    const expiresAt = trial.endDate ?? new Date(Date.now() + 90 * 86400000);
    const { error } = await supabase
      .from('properties')
      .update({ is_active: true, expires_at: expiresAt.toISOString() })
      .eq('id', referenceId as string);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await writeAuditLog('listing.activated', 'property', referenceId as string, user.id, { via: 'trial' });

  } else {
    // Ownership check: provider must belong to the authenticated user
    const { data: providerRow } = await supabase
      .from('service_providers')
      .select('profile_id')
      .eq('id', referenceId as string)
      .single();

    if (!providerRow) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }
    if (providerRow.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    // Idempotency
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('provider_id', referenceId as string)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .maybeSingle();

    if (existingSub) return NextResponse.json({ success: true });

    const trialEnd = trial.endDate ?? new Date(Date.now() + 90 * 86400000);
    const { error: subError } = await supabase
      .from('subscriptions')
      .insert({
        provider_id: referenceId as string,
        start_date: new Date().toISOString(),
        end_date: trialEnd.toISOString(),
        is_active: true,
      });

    if (subError) return NextResponse.json({ error: subError.message }, { status: 500 });

    await supabase
      .from('service_providers')
      .update({ is_visible: true })
      .eq('id', referenceId as string);

    await writeAuditLog('provider.subscribed', 'service_provider', referenceId as string, user.id, { via: 'trial' });
  }

  return NextResponse.json({ success: true });
}
