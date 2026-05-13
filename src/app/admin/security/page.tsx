import { Shield, AlertTriangle, Ban, CheckCircle, Activity } from 'lucide-react';
import {
  getSecurityStats,
  getRecentLoginLogs,
  getBlockedIPs,
} from '@/lib/supabase/admin';
import SecurityActions from './SecurityActions';

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('en-UG', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
    hour12: true,
  });
}

function truncateAgent(ua: string | null): string {
  if (!ua) return '—';
  const m = ua.match(/(Chrome|Firefox|Safari|Edge|Opera)\/[\d.]+/);
  return m ? m[0] : ua.slice(0, 40);
}

export const metadata = { title: 'Security — Admin' };
export const dynamic = 'force-dynamic';

export default async function SecurityPage() {
  const [stats, logs, blockedIPs] = await Promise.all([
    getSecurityStats(),
    getRecentLoginLogs(60),
    getBlockedIPs(),
  ]);

  const failedLogs = logs.filter((l) => !l.success);
  const successLogs = logs.filter((l) => l.success);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield size={20} className="text-orange-500" />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Security Dashboard</h1>
        </div>
        <p className="text-sm text-stone-500 dark:text-slate-400">Login monitoring, IP management, and threat detection</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide font-medium">Failed Logins (24h)</p>
          <p className={`text-3xl font-bold mt-1 ${stats.failedLoginsLast24h > 10 ? 'text-red-500' : 'text-stone-900 dark:text-white'}`}>
            {stats.failedLoginsLast24h}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide font-medium">Total Login Logs</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-white mt-1">{stats.totalLoginLogs}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide font-medium">Blocked IPs</p>
          <p className="text-3xl font-bold text-red-500 mt-1">{stats.blockedIPs}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 p-5 shadow-sm">
          <p className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide font-medium">Suspicious IPs (1h)</p>
          <p className={`text-3xl font-bold mt-1 ${stats.suspiciousIPs.length > 0 ? 'text-amber-500' : 'text-stone-900 dark:text-white'}`}>
            {stats.suspiciousIPs.length}
          </p>
        </div>
      </div>

      {/* Suspicious IPs */}
      {stats.suspiciousIPs.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-amber-500" />
            <h2 className="text-base font-semibold text-stone-700 dark:text-slate-200">Suspicious IPs (last hour)</h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-amber-200 dark:border-amber-800 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Failures</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Distinct Emails</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Last Attempt</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                {stats.suspiciousIPs.map((row) => (
                  <tr key={row.ip_address}>
                    <td className="px-4 py-3 font-mono text-stone-900 dark:text-white">{row.ip_address}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        {row.failure_count}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600 dark:text-slate-300">{row.distinct_emails}</td>
                    <td className="px-4 py-3 text-stone-400 dark:text-slate-500">{formatTimestamp(row.last_attempt)}</td>
                    <td className="px-4 py-3">
                      <SecurityActions ipAddress={row.ip_address} action="block" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Blocked IPs */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Ban size={16} className="text-red-500" />
          <h2 className="text-base font-semibold text-stone-700 dark:text-slate-200">Blocked IPs</h2>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm overflow-hidden">
          {blockedIPs.length === 0 ? (
            <div className="flex items-center gap-2 px-5 py-6 text-sm text-stone-400 dark:text-slate-500">
              <CheckCircle size={16} className="text-green-500" />
              No IPs currently blocked.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Expires</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Blocked</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
                {blockedIPs.map((row) => (
                  <tr key={row.id}>
                    <td className="px-4 py-3 font-mono text-stone-900 dark:text-white">{row.ip_address}</td>
                    <td className="px-4 py-3 text-stone-600 dark:text-slate-300">{row.reason ?? '—'}</td>
                    <td className="px-4 py-3 text-stone-400 dark:text-slate-500">
                      {row.expires_at ? formatTimestamp(row.expires_at) : 'Permanent'}
                    </td>
                    <td className="px-4 py-3 text-stone-400 dark:text-slate-500">{formatTimestamp(row.created_at)}</td>
                    <td className="px-4 py-3">
                      <SecurityActions ipAddress={row.ip_address} action="unblock" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Recent Login Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failures */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={16} className="text-red-500" />
            <h2 className="text-base font-semibold text-stone-700 dark:text-slate-200">
              Recent Failures ({failedLogs.length})
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm divide-y divide-stone-100 dark:divide-slate-700">
            {failedLogs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-400 dark:text-slate-500">No failed logins recorded.</p>
            ) : (
              failedLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-stone-800 dark:text-slate-100 truncate font-mono">{log.email ?? '—'}</p>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full shrink-0">Failed</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-xs text-stone-400 dark:text-slate-500 font-mono">{log.ip_address ?? '—'}</p>
                    <p className="text-xs text-stone-400 dark:text-slate-500">{truncateAgent(log.user_agent)}</p>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{formatTimestamp(log.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Successes */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle size={16} className="text-green-500" />
            <h2 className="text-base font-semibold text-stone-700 dark:text-slate-200">
              Recent Successes ({successLogs.length})
            </h2>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm divide-y divide-stone-100 dark:divide-slate-700">
            {successLogs.length === 0 ? (
              <p className="px-5 py-6 text-sm text-stone-400 dark:text-slate-500">No successful logins recorded yet.</p>
            ) : (
              successLogs.slice(0, 15).map((log) => (
                <div key={log.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-stone-800 dark:text-slate-100 truncate font-mono">{log.email ?? '—'}</p>
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full shrink-0">OK</span>
                  </div>
                  <p className="text-xs text-stone-400 dark:text-slate-500 font-mono mt-1">{log.ip_address ?? '—'}</p>
                  <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{formatTimestamp(log.created_at)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
