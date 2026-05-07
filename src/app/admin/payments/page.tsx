import { getAllPayments } from '@/lib/supabase/admin';
import { formatUGX } from '@/lib/utils';

export const metadata = { title: 'Payments — Admin' };

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    pending:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed:    'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[status] ?? ''}`}>
      {status}
    </span>
  );
}

export default async function AdminPaymentsPage() {
  const payments = await getAllPayments();

  const totalRevenue = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount_ugx, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Payments</h1>
          <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">{payments.length} total transactions</p>
        </div>
        <div className="text-right bg-white dark:bg-slate-800 rounded-2xl px-5 py-3 shadow-sm border border-stone-100 dark:border-slate-700">
          <p className="text-xs text-stone-400 dark:text-slate-500 uppercase tracking-wide font-medium">Total Revenue</p>
          <p className="text-xl font-bold text-orange-500 mt-0.5">{formatUGX(totalRevenue)}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Reference</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
              {payments.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                    No payments yet.
                  </td>
                </tr>
              )}
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="px-4 py-3 font-medium text-stone-800 dark:text-slate-100">
                    {p.profiles?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-900 dark:text-white">
                    {formatUGX(p.amount_ugx)}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 dark:bg-slate-700 text-stone-600 dark:text-slate-300 capitalize">
                      {p.payment_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs font-mono text-stone-400 dark:text-slate-500">
                    {p.reference ?? '—'}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-xs text-stone-400 dark:text-slate-500">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
