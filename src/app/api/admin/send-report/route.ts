import { NextRequest, NextResponse } from 'next/server';
import { verifyAdmin } from '@/lib/supabase/verify-admin';
import { sendReportEmail, buildReportData, buildReportHtml, type ReportPeriod } from '@/lib/email/report';

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const { period, preview } = await request.json() as { period: ReportPeriod; preview?: boolean };

  if (!['daily', 'weekly'].includes(period)) {
    return NextResponse.json({ error: 'Invalid period' }, { status: 400 });
  }

  // Preview mode — return the HTML without sending
  if (preview) {
    const data = await buildReportData(period);
    const html = buildReportHtml(data);
    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } });
  }

  const result = await sendReportEmail(period);
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: `${period} report sent` });
}
