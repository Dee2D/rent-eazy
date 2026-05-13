import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Vercel Cron: 0 3 * * * (daily at 03:00 UTC)
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createServiceRoleClient();
  const startedAt = new Date().toISOString();
  const backupType = req.nextUrl.searchParams.get('type') === 'weekly' ? 'weekly' : 'daily';

  // Insert a pending backup record and capture its ID
  const { data: backupRow, error: insertError } = await supabase
    .from('system_backups')
    .insert({ backup_type: backupType, status: 'running', started_at: startedAt })
    .select('id')
    .single();

  if (insertError || !backupRow) {
    return NextResponse.json({ error: 'Failed to create backup record' }, { status: 500 });
  }

  const backupId: string = backupRow.id;

  try {
    // Aggregate platform stats
    const [
      { count: activeListings },
      { count: totalUsers },
      { count: completedPayments },
      { count: pendingPayments },
      { count: fraudFlags },
      { count: blockedIPs },
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('fraud_flags').select('id', { count: 'exact', head: true }).gte(
        'created_at',
        new Date(Date.now() - 86_400_000).toISOString(),
      ),
      supabase.from('blocked_ips').select('id', { count: 'exact', head: true }),
    ]);

    const stats = {
      active_listings:    activeListings ?? 0,
      total_users:        totalUsers ?? 0,
      completed_payments: completedPayments ?? 0,
      pending_payments:   pendingPayments ?? 0,
      fraud_flags_24h:    fraudFlags ?? 0,
      blocked_ips:        blockedIPs ?? 0,
      snapshot_at:        startedAt,
    };

    await supabase
      .from('system_backups')
      .update({ status: 'completed', stats, completed_at: new Date().toISOString() })
      .eq('id', backupId);

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    await supabase
      .from('system_backups')
      .update({ status: 'failed', error_message: message, completed_at: new Date().toISOString() })
      .eq('id', backupId);

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
