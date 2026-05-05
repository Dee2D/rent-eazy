import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getLandlordProperties } from '@/lib/supabase/properties';
import { getUserPayments } from '@/lib/supabase/payments';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  let properties: Awaited<ReturnType<typeof getLandlordProperties>> = [];
  let payments: Awaited<ReturnType<typeof getUserPayments>> = [];

  try {
    [properties, payments] = await Promise.all([
      getLandlordProperties(user.id),
      getUserPayments(user.id),
    ]);
  } catch {
    // DB not yet configured
  }

  const activeListings = properties.filter((p) => p.is_active).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-white mb-1">
        Welcome back, {profile?.full_name?.split(' ')[0] ?? 'there'}! 👋
      </h1>
      <p className="text-stone-500 dark:text-slate-400 text-sm mb-8">Here&apos;s your overview</p>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors">
          <p className="text-xs text-stone-400 dark:text-slate-500 font-medium uppercase tracking-wide">Active Listings</p>
          <p className="text-3xl font-bold text-orange-500 mt-1">{activeListings}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors">
          <p className="text-xs text-stone-400 dark:text-slate-500 font-medium uppercase tracking-wide">Total Views</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-white mt-1">—</p>
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">Coming soon</p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm transition-colors">
          <p className="text-xs text-stone-400 dark:text-slate-500 font-medium uppercase tracking-wide">Payments Made</p>
          <p className="text-3xl font-bold text-stone-900 dark:text-white mt-1">{payments.length}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/add-property"
          className="bg-orange-500 hover:bg-orange-600 text-white rounded-2xl p-5 shadow-sm transition-colors"
        >
          <p className="text-2xl mb-2">➕</p>
          <p className="font-semibold">Add Property</p>
          <p className="text-xs text-orange-100 mt-0.5">List a new rental</p>
        </Link>
        <Link
          href="/dashboard/properties"
          className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <p className="text-2xl mb-2">🏘️</p>
          <p className="font-semibold text-stone-900 dark:text-white">My Properties</p>
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">{properties.length} total</p>
        </Link>
        <Link
          href="/dashboard/provider"
          className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 hover:border-orange-200 dark:hover:border-orange-500 rounded-2xl p-5 shadow-sm transition-colors"
        >
          <p className="text-2xl mb-2">🔧</p>
          <p className="font-semibold text-stone-900 dark:text-white">Provider Profile</p>
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">Manage your services</p>
        </Link>
      </div>
    </div>
  );
}
