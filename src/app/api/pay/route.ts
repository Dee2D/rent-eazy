import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { generatePaymentReference } from '@/lib/utils';
import type { PaymentType } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, type, referenceId } = body as {
      userId: string;
      amount: number;
      type: PaymentType;
      referenceId: string;
      phoneNumber?: string;
    };

    if (!userId || !amount || !type || !referenceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // service_role bypasses all RLS — safe for server-side payment processing
    const supabase = await createServiceRoleClient();

    // Verify the user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Record payment as pending
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        user_id: userId,
        amount_ugx: amount,
        payment_type: type,
        status: 'pending',
        reference: generatePaymentReference(),
        reference_id: referenceId,
      })
      .select('id')
      .single();

    if (insertError) throw new Error(insertError.message);

    // Simulate mobile money processing delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Mark payment completed
    await supabase
      .from('payments')
      .update({ status: 'completed' })
      .eq('id', payment.id);

    if (type === 'listing') {
      // Idempotency: skip if already active and not yet expired
      const { data: existingProp } = await supabase
        .from('properties')
        .select('is_active, expires_at')
        .eq('id', referenceId)
        .single();

      if (existingProp?.is_active && existingProp.expires_at && new Date(existingProp.expires_at) > new Date()) {
        return NextResponse.json({ success: true, paymentId: payment.id, message: 'Already active' });
      }

      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + 3);

      const { error: propError } = await supabase
        .from('properties')
        .update({ is_active: true, expires_at: expiresAt.toISOString() })
        .eq('id', referenceId);

      if (propError) throw new Error(propError.message);

    } else if (type === 'subscription') {
      // Idempotency: skip if active subscription already exists
      const { data: existingSub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('provider_id', referenceId)
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString())
        .maybeSingle();

      if (existingSub) {
        return NextResponse.json({ success: true, paymentId: payment.id, message: 'Already subscribed' });
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({
          provider_id: referenceId,
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
          is_active: true,
        });

      if (subError) throw new Error(subError.message);

      const { error: visError } = await supabase
        .from('service_providers')
        .update({ is_visible: true })
        .eq('id', referenceId);

      if (visError) throw new Error(visError.message);
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.id,
      message: 'Payment completed',
    });

  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Payment processing failed' },
      { status: 500 }
    );
  }
}
