import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { checkTrialStatus } from '@/lib/supabase/trial';
import type { PaymentType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { userId, type, referenceId } = await request.json() as {
      userId: string;
      type: PaymentType;
      referenceId: string;
    };

    if (!userId || !type || !referenceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServiceRoleClient();

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const trial = checkTrialStatus(profile.trial_end_date);
    if (!trial.isOnTrial) {
      return NextResponse.json({ error: 'Trial has expired — payment required' }, { status: 403 });
    }

    if (type === 'listing') {
      const expiresAt = trial.endDate ?? new Date(Date.now() + 90 * 86400000);

      const { error } = await supabase
        .from('properties')
        .update({ is_active: true, expires_at: expiresAt.toISOString() })
        .eq('id', referenceId)
        .eq('landlord_id', userId);

      if (error) throw new Error(error.message);

    } else if (type === 'subscription') {
      const trialEnd = trial.endDate ?? new Date(Date.now() + 90 * 86400000);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          provider_id: referenceId,
          start_date: new Date().toISOString(),
          end_date: trialEnd.toISOString(),
          is_active: true,
        });

      if (subError) throw new Error(subError.message);

      const { error: visError } = await supabase
        .from('service_providers')
        .update({ is_visible: true })
        .eq('id', referenceId);

      if (visError) throw new Error(visError.message);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Trial activation failed' },
      { status: 500 }
    );
  }
}
