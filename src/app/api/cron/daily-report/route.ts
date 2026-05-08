import { NextRequest, NextResponse } from 'next/server';
import { sendReportEmail } from '@/lib/email/report';

// Called by Vercel Cron every day at 07:00 UTC
// Secured by CRON_SECRET env var
export async function GET(request: NextRequest) {
  const secret = request.headers.get('authorization');
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendReportEmail('daily');
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: new Date().toISOString() });
}
