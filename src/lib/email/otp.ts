/** Send a 2FA/OTP verification email to an admin. */
export async function sendAdminOTPEmail(
  email: string,
  name: string,
  otp: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    // Dev fallback — log to console so devs can still test 2FA
    console.info(`[2FA OTP] ${email}: ${otp}`);
    return;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://rent-eazy.vercel.app';
  const firstName = name.split(' ')[0];

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:480px;margin:32px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">

    <div style="background:#f97316;padding:24px 32px;">
      <p style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.5px;">Rent <span style="color:#fed7aa;">Eazy</span></p>
      <p style="margin:4px 0 0;font-size:11px;color:#fed7aa;letter-spacing:.1em;text-transform:uppercase;">Admin Security</p>
    </div>

    <div style="padding:32px;">
      <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#f8fafc;">Hi ${firstName},</p>
      <p style="margin:0 0 24px;font-size:14px;color:#94a3b8;line-height:1.6;">
        Your two-factor authentication code for Rent Eazy Admin:
      </p>

      <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
        <p style="margin:0;font-size:40px;font-weight:800;color:#f97316;letter-spacing:.25em;font-family:monospace;">${otp}</p>
        <p style="margin:8px 0 0;font-size:12px;color:#64748b;">Expires in 10 minutes</p>
      </div>

      <p style="margin:0 0 8px;font-size:13px;color:#64748b;line-height:1.6;">
        If you did not attempt to sign in to the admin panel, please change your password immediately.
      </p>

      <div style="border-top:1px solid #334155;padding-top:20px;margin-top:24px;">
        <p style="margin:0;font-size:11px;color:#475569;">
          Rent Eazy Admin &middot; <a href="${appUrl}" style="color:#f97316;">${appUrl}</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Rent Eazy Security <security@renteazy.com>',
      to: [email],
      subject: `${otp} — Admin 2FA Code`,
      html,
    }),
  }).catch((err) => {
    console.error('[2FA email] Failed to send OTP email:', err);
  });
}
