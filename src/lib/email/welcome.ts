import type { UserRole } from '@/types';

interface WelcomeEmailData {
  name: string;
  email: string;
  role: UserRole;
}

const ROLE_LINES: Record<string, { headline: string; body: string; cta: string; ctaHref: string }> = {
  landlord: {
    headline: 'Start listing your properties',
    body: 'Your free 3-month trial is active. List your first property today — no payment required for 3 months.',
    cta: 'Add a Property →',
    ctaHref: '/dashboard/add-property',
  },
  provider: {
    headline: 'Create your service profile',
    body: 'Your free 3-month trial is active. Set up your provider profile and start connecting with clients — no payment required for 3 months.',
    cta: 'Create My Profile →',
    ctaHref: '/dashboard/provider',
  },
  tenant: {
    headline: 'Start browsing properties',
    body: 'Explore hundreds of rental listings across Uganda. Filter by district, price, and bedrooms to find your perfect home.',
    cta: 'Browse Properties →',
    ctaHref: '/properties',
  },
};

function buildWelcomeHtml(data: WelcomeEmailData): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';
  const meta = ROLE_LINES[data.role] ?? ROLE_LINES.tenant;
  const firstName = data.name.split(' ')[0];

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:580px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#f97316;padding:32px;">
      <p style="margin:0;font-size:26px;font-weight:800;color:#fff;letter-spacing:-.5px;">Rent <span style="color:#fed7aa;">Eazy</span></p>
      <p style="margin:6px 0 0;font-size:13px;color:#fed7aa;letter-spacing:.05em;text-transform:uppercase;">Find. Rent. Live Easy.</p>
    </div>

    <!-- Body -->
    <div style="padding:32px;">
      <p style="margin:0 0 6px;font-size:22px;font-weight:700;color:#111827;">Welcome, ${firstName}! 🎉</p>
      <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
        Your Rent Eazy account is ready. ${meta.body}
      </p>

      <!-- Feature highlight -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:#c2410c;">${meta.headline}</p>
        <p style="margin:0;font-size:13px;color:#78350f;line-height:1.6;">
          Uganda's trusted rental marketplace — real listings, real landlords, real service providers.
        </p>
      </div>

      <!-- CTA -->
      <a href="${appUrl}${meta.ctaHref}" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;margin-bottom:28px;">
        ${meta.cta}
      </a>

      <!-- Quick links -->
      <div style="border-top:1px solid #f3f4f6;padding-top:20px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">Quick Links</p>
        <div style="display:flex;gap:16px;flex-wrap:wrap;">
          <a href="${appUrl}/properties" style="font-size:13px;color:#f97316;text-decoration:none;">Browse Properties</a>
          <a href="${appUrl}/services" style="font-size:13px;color:#f97316;text-decoration:none;">Find Services</a>
          <a href="${appUrl}/terms" style="font-size:13px;color:#9ca3af;text-decoration:none;">Terms of Use</a>
          <a href="${appUrl}/privacy-policy" style="font-size:13px;color:#9ca3af;text-decoration:none;">Privacy Policy</a>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb;padding:20px 32px;text-align:center;border-top:1px solid #f3f4f6;">
      <p style="margin:0;font-size:11px;color:#9ca3af;line-height:1.6;">
        You received this because you created an account on Rent Eazy.<br>
        <a href="${appUrl}" style="color:#9ca3af;">${appUrl}</a>
      </p>
    </div>

  </div>
</body>
</html>`;
}

export async function sendWelcomeEmail(data: WelcomeEmailData): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Rent Eazy <welcome@renteazy.com>',
      to: [data.email],
      subject: `Welcome to Rent Eazy, ${data.name.split(' ')[0]}!`,
      html: buildWelcomeHtml(data),
    }),
  }).catch(() => { /* welcome email is non-critical — never throw */ });
}
