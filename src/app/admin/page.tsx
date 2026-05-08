import { Users, Building2, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import {
  getAdminStats,
  getRecentListings,
  getRecentPayments,
  getListingsChartData,
  getRevenueChartData,
} from '@/lib/supabase/admin';
import StatsCard from '@/components/admin/StatsCard';
import Charts from '@/components/admin/Charts';
import SendReportButton from '@/components/admin/SendReportButton';
import { formatUGX } from '@/lib/utils';

function statusBadge(isActive: boolean, isTaken: boolean, expiresAt: string | null) {
  if (isTaken) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Taken</span>;
  if (isActive) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Active</span>;
  if (expiresAt && new Date(expiresAt) < new Date()) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">Expired</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-500 dark:bg-slate-700 dark:text-slate-400">Inactive</span>;
}

function paymentBadge(status: string) {
  if (status === 'completed') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Completed</span>;
  if (status === 'pending') return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">Pending</span>;
  return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Failed</span>;
}

export default async function AdminPage() {
  const [stats, recentListings, recentPayments, listingsChart, revenueChart] = await Promise.all([
    getAdminStats(),
    getRecentListings(6),
    getRecentPayments(6),
    getListingsChartData(),
    getRevenueChartData(),
  ]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Overview</h1>
        <p className="text-sm text-stone-500 dark:text-slate-400 mt-0.5">Platform snapshot</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard title="Total Users"      value={stats.totalUsers}      icon={Users}        color="blue" />
        <StatsCard title="Total Properties" value={stats.totalProperties} icon={Building2}    color="orange" />
        <StatsCard title="Active Listings"  value={stats.activeListings}  icon={CheckCircle}  color="green" />
        <StatsCard title="Expired Listings" value={stats.expiredListings} icon={Clock}        color="red" />
        <StatsCard
          title="Total Revenue"
          value={formatUGX(stats.totalRevenue)}
          icon={TrendingUp}
          color="purple"
          subtitle="completed payments"
        />
      </div>

      {/* Charts */}
      <Charts listingsData={listingsChart} revenueData={revenueChart} />

      {/* Email reports */}
      <SendReportButton />

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent listings */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-slate-200">Recent Listings</h2>
            <a href="/admin/properties" className="text-xs text-orange-500 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-slate-700">
            {recentListings.length === 0 && (
              <p className="px-5 py-6 text-sm text-stone-400 dark:text-slate-500">No listings yet.</p>
            )}
            {recentListings.map((p) => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 dark:text-slate-100 truncate">{p.title}</p>
                  <p className="text-xs text-stone-400 dark:text-slate-500">{p.district} · {p.profiles?.full_name ?? '—'}</p>
                </div>
                {statusBadge(p.is_active, p.is_taken, p.expires_at)}
              </div>
            ))}
          </div>
        </div>

        {/* Recent payments */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700">
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 dark:border-slate-700">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-slate-200">Recent Payments</h2>
            <a href="/admin/payments" className="text-xs text-orange-500 hover:underline">View all</a>
          </div>
          <div className="divide-y divide-stone-100 dark:divide-slate-700">
            {recentPayments.length === 0 && (
              <p className="px-5 py-6 text-sm text-stone-400 dark:text-slate-500">No payments yet.</p>
            )}
            {recentPayments.map((pay) => (
              <div key={pay.id} className="px-5 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 dark:text-slate-100">{formatUGX(pay.amount_ugx)}</p>
                  <p className="text-xs text-stone-400 dark:text-slate-500">
                    {pay.profiles?.full_name ?? '—'} · {pay.payment_type}
                  </p>
                </div>
                {paymentBadge(pay.status)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
