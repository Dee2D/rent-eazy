import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';
import { Resend } from 'resend';

// Vercel Cron: 0 6 * * * (daily at 06:00 UTC)
export const maxDuration = 60;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!resend) {
    return NextResponse.json({ skipped: 'RESEND_API_KEY not set' });
  }

  const supabase = await createServiceRoleClient();

  // Find active listings expiring in 1–4 days that haven't had a warning sent
  const now = new Date();
  const in1Day = new Date(now.getTime() + 86_400_000).toISOString();
  const in4Days = new Date(now.getTime() + 4 * 86_400_000).toISOString();

  const { data: listings } = await supabase
    .from('properties')
    .select('id, title, expires_at, landlord_id, profiles(full_name, phone_number)')
    .eq('is_active', true)
    .gte('expires_at', in1Day)
    .lte('expires_at', in4Days)
    .eq('expiry_warning_sent', false);

  if (!listings || listings.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Fetch landlord emails from auth.users via service role
  const landlordIds = [...new Set(listings.map((l: { landlord_id: string }) => l.landlord_id))];
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  (users?.users ?? []).forEach((u) => {
    if (landlordIds.includes(u.id) && u.email) {
      emailMap.set(u.id, u.email);
    }
  });

  let sent = 0;
  const warningIds: string[] = [];

  for (const listing of listings as Array<{
    id: string; title: string; expires_at: string; landlord_id: string;
    profiles: unknown;
  }>) {
    const profileName = (Array.isArray(listing.profiles) ? listing.profiles[0] : listing.profiles) as { full_name?: string } | null;
    const email = emailMap.get(listing.landlord_id);
    if (!email) continue;

    const daysLeft = Math.ceil(
      (new Date(listing.expires_at).getTime() - now.getTime()) / 86_400_000
    );
    const name = profileName?.full_name ?? 'Landlord';
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';

    try {
      await resend.emails.send({
        from: 'Rent Eazy <noreply@rent-eazy.vercel.app>',
        to: email,
        subject: `Your listing "${listing.title}" expires in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:auto;padding:32px 24px;background:#fff;">
            <h2 style="color:#f97316;margin:0 0 8px;">Listing Expiry Notice</h2>
            <p style="color:#1c1917;">Hi ${name},</p>
            <p style="color:#57534e;">Your listing <strong>${listing.title}</strong> will expire in
              <strong>${daysLeft} day${daysLeft !== 1 ? 's' : ''}</strong>
              (${new Date(listing.expires_at).toLocaleDateString('en-GB', { dateStyle: 'long' })}).
            </p>
            <p style="color:#57534e;">Renew it now to keep it visible to tenants across Uganda.</p>
            <a href="${appUrl}/dashboard/properties"
               style="display:inline-block;background:#f97316;color:#fff;font-weight:600;padding:12px 24px;border-radius:12px;text-decoration:none;margin-top:16px;">
              Renew Listing
            </a>
            <p style="color:#a8a29e;font-size:12px;margin-top:32px;">Rent Eazy &mdash; Uganda&apos;s rental marketplace</p>
          </div>
        `,
      });
      sent++;
      warningIds.push(listing.id);
    } catch {
      // Non-fatal — continue with remaining listings
    }
  }

  // Mark listings as warned so we don't send twice
  if (warningIds.length > 0) {
    await supabase
      .from('properties')
      .update({ expiry_warning_sent: true })
      .in('id', warningIds);
  }

  return NextResponse.json({ sent });
}
