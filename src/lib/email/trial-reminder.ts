import { LISTING_FEE, SUBSCRIPTION_FEE } from '@/lib/constants';
import { formatUGX } from '@/lib/utils';

interface ReminderEmailData {
  name: string;
  email: string;
  trialEndDate: Date;
  daysLeft: number;
  hasProperty: boolean;
  hasProvider: boolean;
}

function buildReminderHtml(data: ReminderEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';
  const formattedEnd = data.trialEndDate.toLocaleDateString('en-UG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const usageLines: string[] = [];
  if (data.hasProperty) usageLines.push(`<li style="margin-bottom:4px;">Property listings (${formatUGX(LISTING_FEE)} per listing, active for 30 days)</li>`);
  if (data.hasProvider) usageLines.push(`<li style="margin-bottom:4px;">Service provider profile (${formatUGX(SUBSCRIPTION_FEE)} per 30 days)</li>`);
  const usageHtml = usageLines.length
    ? `<ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:1.8;">${usageLines.join('')}</ul>`
    : `<p style="color:#374151;font-size:14px;">your account on Rent Eazy</p>`;

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#f97316;padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">Rent Eazy</p>
      <p style="margin:4px 0 0;font-size:13px;color:#fed7aa;">Uganda's rental & services marketplace</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:16px;color:#111827;">Hi ${data.name},</p>
      <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">
        Your <strong>free 3-month trial</strong> ends in <strong style="color:#f97316;">${data.daysLeft} days</strong> — on <strong>${formattedEnd}</strong>.
        After that date, continued access to the following features will require payment:
      </p>

      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
        ${usageHtml}
      </div>

      <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
        To keep your listings and profile active after the trial, simply log in to your dashboard and complete a payment using MTN Mobile Money or Airtel Money. Your listings stay live instantly once payment is confirmed.
      </p>

      <a href="${appUrl}/dashboard" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:600;font-size:15px;margin-bottom:24px;">
        Go to My Dashboard →
      </a>

      <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
        <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.6;">
          Questions? Reply to this email or reach us on WhatsApp. We're happy to help.<br>
          — The Rent Eazy team
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:16px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;">
        You're receiving this because you have an active free trial on Rent Eazy.<br>
        <a href="${appUrl}" style="color:#9ca3af;">${appUrl}</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendTrialReminderEmail(data: ReminderEmailData): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { success: false, error: 'RESEND_API_KEY not configured' };

  const html = buildReminderHtml(data);
  const subject = `Your free trial ends in ${data.daysLeft} days — Rent Eazy`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Rent Eazy <noreply@renteazy.com>',
      to: [data.email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { success: false, error: err };
  }
  return { success: true };
}
