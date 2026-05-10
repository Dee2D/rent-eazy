import { NextRequest, NextResponse } from 'next/server';
import { sendReportEmail } from '@/lib/email/report';

// Called by Vercel Cron every Monday at 07:00 UTC
// Secured by CRON_SECRET env var
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const secret = request.headers.get('authorization');
  if (!cronSecret || secret !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await sendReportEmail('weekly');
  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true, sent: new Date().toISOString() });
}
