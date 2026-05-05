'use client';

import { useState, useMemo } from 'react';
import PaymentModal from '@/components/payment/PaymentModal';
import { createClient } from '@/lib/supabase/client';
import type { ServiceProvider, ServiceCategory, Subscription } from '@/types';

interface Props {
  userId: string;
  phoneNumber: string;
  existingProvider: ServiceProvider | null;
  categories: ServiceCategory[];
  subscription: Subscription | null;
}

export default function ProviderClient({ userId, phoneNumber, existingProvider, categories, subscription }: Props) {
  const [provider, setProvider] = useState<ServiceProvider | null>(existingProvider);
  const [showPayment, setShowPayment] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [now] = useState(Date.now);

  const [form, setForm] = useState({
    category_id: categories[0]?.id ?? '',
    description: '',
    latitude: 0.3476,
    longitude: 32.5899,
  });

  const daysLeft = useMemo(() => {
    if (!subscription) return 0;
    return Math.max(0, Math.ceil((new Date(subscription.end_date).getTime() - now) / 86400000));
  }, [subscription, now]);

  async function createProvider() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: dbErr } = await supabase
        .from('service_providers')
        .insert({ ...form, profile_id: userId, is_visible: false })
        .select('*, service_categories(name)')
        .single();
      if (dbErr) throw new Error(dbErr.message);
      setProvider(data as ServiceProvider);
      setShowPayment(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create profile');
    } finally {
      setLoading(false);
    }
  }

  if (!provider) {
    return (
      <div className="space-y-5">
        <p className="text-stone-500 dark:text-slate-400 text-sm">Create your service provider profile and subscribe to appear on the map.</p>

        {error && <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Service Category</label>
          <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
            className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white">
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3} className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
            placeholder="Describe your services and experience…" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Latitude</label>
            <input type="number" step="0.0001" value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Longitude</label>
            <input type="number" step="0.0001" value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: Number(e.target.value) })}
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-white" />
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4 text-sm">
          <p className="font-semibold text-stone-900 dark:text-white mb-1">Subscription Fee</p>
          <p className="text-stone-600 dark:text-slate-400">Pay UGX 30,000 to appear on the map for 30 days.</p>
        </div>

        <button
          onClick={createProvider}
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
        >
          {loading ? 'Creating…' : 'Create Profile & Subscribe'}
        </button>

        {provider && (
          <PaymentModal
            isOpen={showPayment}
            onClose={() => setShowPayment(false)}
            onSuccess={() => window.location.reload()}
            amount={30000}
            type="subscription"
            referenceId={(provider as ServiceProvider).id}
            userId={userId}
            phoneNumber={phoneNumber}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-stone-400 dark:text-slate-500 mb-1">Category</p>
        <p className="font-semibold text-stone-900 dark:text-white">{provider.service_categories?.name ?? '—'}</p>
        {provider.description && <p className="text-sm text-stone-500 dark:text-slate-400 mt-2">{provider.description}</p>}
      </div>

      <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-5 shadow-sm">
        <p className="text-sm text-stone-400 dark:text-slate-500 mb-1">Subscription Status</p>
        {subscription ? (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="font-semibold text-green-700 dark:text-green-400">Active</span>
            </div>
            <p className="text-sm text-stone-500 dark:text-slate-400">{daysLeft} days remaining</p>
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">Expires {new Date(subscription.end_date).toLocaleDateString('en-UG')}</p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-stone-300 dark:bg-slate-600" />
              <span className="font-semibold text-stone-500 dark:text-slate-400">Inactive</span>
            </div>
            <button
              onClick={() => setShowPayment(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              Subscribe — UGX 30,000
            </button>
          </>
        )}
        {subscription && (
          <button
            onClick={() => setShowPayment(true)}
            className="mt-3 text-sm text-orange-500 hover:underline"
          >
            Renew Subscription
          </button>
        )}
      </div>

      <PaymentModal
        isOpen={showPayment}
        onClose={() => setShowPayment(false)}
        onSuccess={() => window.location.reload()}
        amount={30000}
        type="subscription"
        referenceId={provider.id}
        userId={userId}
        phoneNumber={phoneNumber}
      />
    </div>
  );
}
