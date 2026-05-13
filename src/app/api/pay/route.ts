import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient, createClient } from '@/lib/supabase/server';
import { verifyMobileMoneyPayment } from '@/lib/payments';
import { generatePaymentReference } from '@/lib/utils';
import { checkRateLimit, getClientIp, isValidUUID } from '@/lib/security';
import { writeAuditLog } from '@/lib/audit';
import { LISTING_FEE, SUBSCRIPTION_FEE } from '@/lib/constants';
import type { PaymentType, MobileMoneyProvider } from '@/types';

export async function POST(request: NextRequest) {
  // Rate limit: 5 payment attempts per IP per 10 minutes
  const ip = getClientIp(request.headers);
  const rl = checkRateLimit(`pay:${ip}`, 5, 10 * 60 * 1000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Too many payment attempts. Please wait before trying again.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) } }
    );
  }

  // Authenticate session — user must be logged in
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const type = body.type as PaymentType;
  const referenceId = body.referenceId as string;
  const phoneNumber = typeof body.phoneNumber === 'string' ? body.phoneNumber : '';
  const provider = (body.provider as MobileMoneyProvider) ?? 'mtn';

  if (!type || !referenceId) {
    return NextResponse.json({ error: 'Missing required fields: type, referenceId' }, { status: 400 });
  }
  if (!['listing', 'subscription'].includes(type)) {
    return NextResponse.json({ error: 'Invalid payment type' }, { status: 400 });
  }
  if (!['mtn', 'airtel'].includes(provider)) {
    return NextResponse.json({ error: 'Invalid payment provider' }, { status: 400 });
  }
  if (!isValidUUID(referenceId)) {
    return NextResponse.json({ error: 'Invalid referenceId format' }, { status: 400 });
  }

  // Authoritative amount — never trust the client-supplied amount
  const amount = type === 'listing' ? LISTING_FEE : SUBSCRIPTION_FEE;

  const supabase = await createServiceRoleClient();

  // Ownership verification + idempotency
  if (type === 'listing') {
    const { data: prop } = await supabase
      .from('properties')
      .select('landlord_id, is_active, expires_at')
      .eq('id', referenceId)
      .single();

    if (!prop) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (prop.landlord_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (prop.is_active && prop.expires_at && new Date(prop.expires_at) > new Date()) {
      return NextResponse.json({ success: true, message: 'Listing is already active' });
    }
  } else {
    const { data: providerRow } = await supabase
      .from('service_providers')
      .select('profile_id')
      .eq('id', referenceId)
      .single();

    if (!providerRow) {
      return NextResponse.json({ error: 'Service provider not found' }, { status: 404 });
    }
    if (providerRow.profile_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    const { data: existingSub } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('provider_id', referenceId)
      .eq('is_active', true)
      .gt('end_date', new Date().toISOString())
      .maybeSingle();
    if (existingSub) {
      return NextResponse.json({ success: true, message: 'Subscription already active' });
    }
  }

  // Check for a pending payment on the same reference to prevent duplicates
  const { data: existingPending } = await supabase
    .from('payments')
    .select('id')
    .eq('user_id', user.id)
    .eq('reference_id', referenceId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingPending) {
    return NextResponse.json(
      { error: 'A payment for this item is already being processed. Please wait.' },
      { status: 409 }
    );
  }

  // Create payment record as pending
  const reference = generatePaymentReference();
  const { data: payment, error: insertError } = await supabase
    .from('payments')
    .insert({
      user_id: user.id,
      amount_ugx: amount,
      payment_type: type,
      status: 'pending',
      reference,
      reference_id: referenceId,
      phone_number: phoneNumber || null,
      mobile_provider: provider,
    })
    .select('id')
    .single();

  if (insertError || !payment) {
    return NextResponse.json({ error: 'Could not initialize payment. Please try again.' }, { status: 500 });
  }

  await writeAuditLog('payment.initiated', type, referenceId, user.id, { paymentId: payment.id, amount, provider }, ip);

  // Verify payment with the mobile money provider
  const verifyResult = await verifyMobileMoneyPayment(provider, reference, phoneNumber);

  if (!verifyResult.verified || verifyResult.status !== 'completed') {
    await supabase.from('payments').update({ status: 'failed' }).eq('id', payment.id);
    await writeAuditLog('payment.failed', type, referenceId, user.id, { paymentId: payment.id, reason: verifyResult.providerMessage }, ip);
    return NextResponse.json(
      { error: 'Payment was not confirmed by your mobile money provider. Please try again.' },
      { status: 402 }
    );
  }

  // Mark payment completed with timestamp
  await supabase
    .from('payments')
    .update({ status: 'completed', verified_at: new Date().toISOString() })
    .eq('id', payment.id);

  // Activate the resource
  if (type === 'listing') {
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 3);
    const { error } = await supabase
      .from('properties')
      .update({ is_active: true, expires_at: expiresAt.toISOString() })
      .eq('id', referenceId);

    if (error) {
      // Payment succeeded but activation failed — this needs manual recovery
      console.error('[pay] Listing activation failed after payment:', payment.id, error.message);
      return NextResponse.json(
        { error: 'Payment successful but listing activation failed. Contact support with your payment ID: ' + payment.id },
        { status: 500 }
      );
    }
    await writeAuditLog('listing.activated', 'property', referenceId, user.id, { paymentId: payment.id }, ip);

  } else {
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

    if (subError) {
      console.error('[pay] Subscription creation failed after payment:', payment.id, subError.message);
      return NextResponse.json(
        { error: 'Payment successful but subscription activation failed. Contact support with your payment ID: ' + payment.id },
        { status: 500 }
      );
    }

    await supabase
      .from('service_providers')
      .update({ is_visible: true })
      .eq('id', referenceId);

    await writeAuditLog('provider.subscribed', 'service_provider', referenceId, user.id, { paymentId: payment.id }, ip);
  }

  return NextResponse.json({ success: true, paymentId: payment.id, message: 'Payment completed' });
}
