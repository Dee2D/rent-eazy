import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getLandlordProperties } from '@/lib/supabase/properties';
import LandlordDashboardClient from './LandlordDashboardClient';
import TrialBanner from '@/components/trial/TrialBanner';
import type { Profile } from '@/types';

const HOW_TO_STEPS = [
  { icon: '📍', title: 'Pin your location', body: 'Use the interactive map to drop a pin at the exact address. Accuracy helps tenants find you faster.' },
  { icon: '✍️', title: 'Write a clear description', body: 'Mention furnishing, nearby amenities, water supply, security, and any special terms.' },
  { icon: '🏠', title: 'Choose the right type', body: 'Select Apartment, House, or Bedsitter — and whether you are the Landlord, a Broker, or a Property Agent.' },
  { icon: '📷', title: 'Upload at least 6 photos', body: 'Listings with more photos get 3× more enquiries. Show every room, the exterior, and the compound.' },
  { icon: '💰', title: 'Set a fair price', body: 'Research similar properties nearby and set a competitive price. You can update it later.' },
  { icon: '💳', title: 'Pay UGX 10,000', body: 'A one-time listing fee activates your property for 3 months. Renew anytime from your dashboard.' },
];

export default async function LandlordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  let properties: Awaited<ReturnType<typeof getLandlordProperties>> = [];
  try {
    properties = await getLandlordProperties(user.id);
  } catch {
    // DB not configured
  }

  const activeCount = properties.filter((p) => p.is_active && p.expires_at && new Date(p.expires_at) > new Date()).length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Trial banner */}
      <TrialBanner profile={profile as Profile | null} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">
            Welcome, {profile?.full_name?.split(' ')[0] ?? 'Landlord'} 👋
          </h1>
          <p className="text-stone-500 dark:text-slate-400 text-sm mt-0.5">
            {activeCount > 0
              ? `You have ${activeCount} active listing${activeCount !== 1 ? 's' : ''}`
              : 'You have no active listings yet — add one below'}
          </p>
        </div>
        <Link
          href="/dashboard/add-property"
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-2xl shadow-sm transition-colors whitespace-nowrap"
        >
          <span className="text-lg">➕</span> Add New Property
        </Link>
      </div>

      {/* How-to instructions card */}
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-5">
          <span className="text-2xl">📋</span>
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">How to List Your Property</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {HOW_TO_STEPS.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="shrink-0 w-9 h-9 bg-orange-50 dark:bg-orange-900/20 rounded-xl flex items-center justify-center text-lg">
                {step.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-stone-800 dark:text-slate-200">{step.title}</p>
                <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fee highlight */}
        <div className="mt-5 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-2xl">💳</span>
          <div>
            <p className="text-sm font-semibold text-stone-900 dark:text-white">Listing Fee: UGX 10,000 per property</p>
            <p className="text-xs text-stone-500 dark:text-slate-400">Active for 3 months · Pay via MTN MoMo or Airtel Money</p>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-stone-900 dark:text-white">Your Listings</h2>
          <span className="text-sm text-stone-400 dark:text-slate-500">{properties.length} total</span>
        </div>
        <LandlordDashboardClient properties={properties} userId={user.id} />
      </div>
    </div>
  );
}
