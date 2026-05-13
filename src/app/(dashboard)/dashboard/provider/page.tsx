import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getProviderByProfileId, getServiceCategories } from '@/lib/supabase/providers';
import ProviderClient from './ProviderClient';
import TrialStatusCard from '@/components/trial/TrialStatusCard';
import type { Profile } from '@/types';

export default async function ProviderDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();

  let provider = null;
  let categories: Awaited<ReturnType<typeof getServiceCategories>> = [];
  let subscription = null;

  try {
    [provider, categories] = await Promise.all([
      getProviderByProfileId(user.id),
      getServiceCategories(),
    ]);

    if (provider) {
      const { data } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('provider_id', provider.id)
        .eq('is_active', true)
        .gt('end_date', new Date().toISOString())
        .order('end_date', { ascending: false })
        .limit(1)
        .single();
      subscription = data;
    }
  } catch {
    // DB not configured
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Provider Profile</h1>
      <TrialStatusCard profile={profile as Profile | null} />
      <ProviderClient
        userId={user.id}
        phoneNumber={profile?.phone_number ?? ''}
        existingProvider={provider}
        categories={categories}
        subscription={subscription}
        trialEndDate={profile?.trial_end_date ?? null}
      />
    </div>
  );
}
