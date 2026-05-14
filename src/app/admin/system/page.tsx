import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getSystemHealth } from '@/lib/supabase/admin';
import { Activity, Database, Flag, ShieldOff, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

async function requireAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/dashboard');
}

function calcBackupAgeHours(completedAt: string): number {
  return Math.round((Date.now() - new Date(completedAt).getTime()) / 3_600_000);
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode }> = {
    completed: { cls: 'bg-green-500/20 text-green-400', icon: <CheckCircle size={13} /> },
    running:   { cls: 'bg-blue-500/20 text-blue-400',   icon: <Activity size={13} /> },
    failed:    { cls: 'bg-red-500/20 text-red-400',     icon: <XCircle size={13} /> },
  };
  const { cls, icon } = map[status] ?? { cls: 'bg-stone-700 text-stone-400', icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>
      {icon} {status}
    </span>
  );
}

function ActionBadge({ action }: { action: string }) {
  const map: Record<string, string> = {
    allow:  'bg-green-500/20 text-green-400',
    review: 'bg-amber-500/20 text-amber-400',
    reject: 'bg-red-500/20 text-red-400',
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[action] ?? 'bg-stone-700 text-stone-400'}`}>
      {action}
    </span>
  );
}

export default async function SystemPage() {
  await requireAdmin();
  const health = await getSystemHealth();

  const stats = [
    { label: 'Active Listings', value: health.activeListings.toLocaleString(), icon: Activity, color: 'text-orange-400' },
    { label: 'Total Users',     value: health.totalUsers.toLocaleString(),     icon: Database, color: 'text-blue-400' },
    { label: 'Pending Payments',value: health.pendingPayments.toLocaleString(),icon: Clock,    color: 'text-amber-400' },
    { label: 'Fraud Flags Today',value: health.fraudFlagsToday.toLocaleString(),icon: Flag,   color: 'text-red-400' },
    { label: 'Blocked IPs',     value: health.blockedIPs.toLocaleString(),     icon: ShieldOff,color: 'text-rose-400' },
  ];

  const backup = health.lastBackup;
  const backupAge = backup?.completed_at
    ? calcBackupAgeHours(backup.completed_at)
    : null;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">System Health</h1>
        <p className="text-stone-400 text-sm mt-1">Platform vitals and monitoring overview</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-stone-900 border border-stone-800 rounded-2xl p-4">
            <Icon size={20} className={`${color} mb-2`} />
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-stone-400 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Last backup */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Database size={18} className="text-orange-400" /> Last Backup
        </h2>
        {backup ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <StatusBadge status={backup.status} />
              <span className="text-stone-400 text-sm capitalize">{backup.backup_type}</span>
              {backupAge !== null && (
                <span className={`text-sm ${backupAge > 26 ? 'text-amber-400' : 'text-stone-400'}`}>
                  {backupAge}h ago
                </span>
              )}
              {backupAge !== null && backupAge > 26 && (
                <span className="flex items-center gap-1 text-amber-400 text-xs">
                  <AlertTriangle size={13} /> Backup overdue
                </span>
              )}
            </div>
            {backup.stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {Object.entries(backup.stats).filter(([k]) => k !== 'snapshot_at').map(([key, val]) => (
                  <div key={key} className="bg-stone-800 rounded-xl px-3 py-2">
                    <p className="text-xs text-stone-500 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-white font-semibold text-sm">{String(val)}</p>
                  </div>
                ))}
              </div>
            )}
            {backup.error_message && (
              <p className="text-red-400 text-sm mt-2">{backup.error_message}</p>
            )}
          </div>
        ) : (
          <p className="text-stone-500 text-sm">No backups recorded yet. The daily cron runs at 03:00 UTC.</p>
        )}
      </div>

      {/* Recent fraud flags */}
      <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-800 flex items-center gap-2">
          <Flag size={18} className="text-red-400" />
          <h2 className="text-lg font-semibold text-white">Recent Fraud Flags</h2>
        </div>
        {health.recentFraudFlags.length === 0 ? (
          <div className="px-6 py-8 text-center text-stone-500 text-sm">No fraud flags recorded.</div>
        ) : (
          <div className="divide-y divide-stone-800">
            {health.recentFraudFlags.map((flag) => (
              <div key={flag.id} className="px-6 py-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-stone-300 text-sm font-medium capitalize">{flag.entity_type}</span>
                    <ActionBadge action={flag.action} />
                    <span className="text-stone-500 text-xs">score {flag.fraud_score}</span>
                  </div>
                  <p className="text-stone-500 text-xs truncate">{flag.entity_id}</p>
                  {flag.flags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {flag.flags.map((f) => (
                        <span key={f} className="bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded text-xs">
                          {f}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <time className="text-stone-600 text-xs shrink-0 pt-0.5">
                  {new Date(flag.created_at).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' })}
                </time>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
