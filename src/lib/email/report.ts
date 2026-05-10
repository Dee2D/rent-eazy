import { createServiceRoleClient } from '@/lib/supabase/server';
import { formatUGX } from '@/lib/utils';

export type ReportPeriod = 'daily' | 'weekly';

interface ReportData {
  period: ReportPeriod;
  totalUsers: number;
  totalProperties: number;
  activeListings: number;
  totalRevenue: number;
  newUsers: number;
  newListings: number;
  newPayments: number;
  periodRevenue: number;
  recentListings: { title: string; district: string; created_at: string }[];
  recentPayments: { amount_ugx: number; payment_type: string; status: string; created_at: string }[];
}

export async function buildReportData(period: ReportPeriod): Promise<ReportData> {
  const supabase = await createServiceRoleClient();
  const days = period === 'daily' ? 1 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const [
    { count: totalUsers },
    { count: totalProperties },
    { count: activeListings },
    { count: newUsers },
    { count: newListings },
    { data: allPayments },
    { data: periodPayments },
    { data: recentListings },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }),
    supabase.from('properties').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sinceISO),
    supabase.from('properties').select('*', { count: 'exact', head: true }).gte('created_at', sinceISO),
    supabase.from('payments').select('amount_ugx').eq('status', 'completed'),
    supabase.from('payments').select('amount_ugx, payment_type, status, created_at').gte('created_at', sinceISO),
    supabase.from('properties').select('title, district, created_at').order('created_at', { ascending: false }).limit(5),
  ]);

  const totalRevenue = allPayments?.reduce((s, p) => s + p.amount_ugx, 0) ?? 0;
  const periodRevenue = periodPayments?.filter((p) => p.status === 'completed').reduce((s, p) => s + p.amount_ugx, 0) ?? 0;

  return {
    period,
    totalUsers: totalUsers ?? 0,
    totalProperties: totalProperties ?? 0,
    activeListings: activeListings ?? 0,
    totalRevenue,
    newUsers: newUsers ?? 0,
    newListings: newListings ?? 0,
    newPayments: periodPayments?.length ?? 0,
    periodRevenue,
    recentListings: recentListings ?? [],
    recentPayments: periodPayments ?? [],
  };
}

export function buildReportHtml(data: ReportData): string {
  const title = data.period === 'daily' ? 'Daily Report' : 'Weekly Report';
  const periodLabel = data.period === 'daily' ? 'Today' : 'This Week';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://renteazy.com';

  const listingsRows = data.recentListings.map((l) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">${l.title}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${l.district}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;">${new Date(l.created_at).toLocaleDateString()}</td>
    </tr>`).join('');

  const paymentsRows = data.recentPayments.slice(0, 5).map((p) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;font-weight:600;">${formatUGX(p.amount_ugx)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;color:#6b7280;text-transform:capitalize;">${p.payment_type}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6;">
        <span style="background:${p.status === 'completed' ? '#dcfce7' : '#fef9c3'};color:${p.status === 'completed' ? '#16a34a' : '#ca8a04'};padding:2px 8px;border-radius:999px;font-size:12px;">${p.status}</span>
      </td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

    <!-- Header -->
    <div style="background:#1c1917;padding:28px 32px;">
      <p style="margin:0;font-size:22px;font-weight:700;color:#fff;">
        Rent <span style="color:#f97316;">Eazy</span>
      </p>
      <p style="margin:6px 0 0;color:#a8a29e;font-size:13px;text-transform:uppercase;letter-spacing:.08em;">${title} — ${new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
    </div>

    <!-- Period stats -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">${periodLabel}</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        ${statBox(String(data.newUsers),    'New Users',    '#3b82f6')}
        ${statBox(String(data.newListings), 'New Listings', '#f97316')}
        ${statBox(String(data.newPayments), 'Payments',     '#8b5cf6')}
        ${statBox(formatUGX(data.periodRevenue), 'Revenue', '#22c55e')}
      </div>
    </div>

    <!-- Platform totals -->
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;background:#fafafa;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">Platform Totals</p>
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        ${statBox(String(data.totalUsers),      'Total Users',      '#6b7280')}
        ${statBox(String(data.totalProperties), 'Properties',       '#6b7280')}
        ${statBox(String(data.activeListings),  'Active Listings',  '#6b7280')}
        ${statBox(formatUGX(data.totalRevenue), 'Total Revenue',    '#6b7280')}
      </div>
    </div>

    <!-- Recent listings -->
    ${data.recentListings.length > 0 ? `
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">Recent Listings</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">Title</th>
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">District</th>
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">Date</th>
          </tr>
        </thead>
        <tbody>${listingsRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Recent payments -->
    ${data.recentPayments.length > 0 ? `
    <div style="padding:24px 32px;border-bottom:1px solid #f3f4f6;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.08em;">Recent Payments</p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="background:#f9fafb;">
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">Amount</th>
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">Type</th>
            <th style="text-align:left;padding:8px 12px;font-size:11px;color:#6b7280;font-weight:600;">Status</th>
          </tr>
        </thead>
        <tbody>${paymentsRows}</tbody>
      </table>
    </div>` : ''}

    <!-- Footer -->
    <div style="padding:24px 32px;text-align:center;">
      <a href="${appUrl}/admin" style="display:inline-block;background:#f97316;color:#fff;text-decoration:none;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;">
        Open Admin Dashboard
      </a>
      <p style="margin:16px 0 0;font-size:12px;color:#9ca3af;">
        This is an automated report from Rent Eazy. Do not reply to this email.
      </p>
    </div>

  </div>
</body>
</html>`;
}

function statBox(value: string, label: string, color: string): string {
  return `<div style="flex:1;min-width:120px;background:#fff;border:1px solid #f3f4f6;border-radius:10px;padding:14px 16px;">
    <p style="margin:0;font-size:20px;font-weight:700;color:${color};">${value}</p>
    <p style="margin:4px 0 0;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;">${label}</p>
  </div>`;
}

export async function sendReportEmail(period: ReportPeriod): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!apiKey)    return { success: false, error: 'RESEND_API_KEY not configured' };
  if (!adminEmail) return { success: false, error: 'ADMIN_EMAIL not configured' };

  const data = await buildReportData(period);
  const html = buildReportHtml(data);
  const subject = period === 'daily'
    ? `Daily Report — ${new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}`
    : `Weekly Report — ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Rent Eazy <reports@renteazy.com>',
      to: [adminEmail],
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
