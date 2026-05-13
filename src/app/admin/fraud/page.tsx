import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createServiceRoleClient } from '@/lib/supabase/server';
import FraudActions from './FraudActions';
import { Flag, CheckCircle } from 'lucide-react';

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

function ScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 70 ? 'bg-red-500/20 text-red-400' :
    score >= 40 ? 'bg-amber-500/20 text-amber-400' :
                  'bg-stone-700 text-stone-400';
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold tabular-nums ${cls}`}>
      {score}
    </span>
  );
}

export default async function FraudPage() {
  await requireAdmin();
  const service = await createServiceRoleClient();

  const { data: flags } = await service
    .from('fraud_flags')
    .select('*')
    .eq('reviewed', false)
    .order('fraud_score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const items = (flags ?? []) as Array<{
    id: string;
    entity_type: string;
    entity_id: string;
    fraud_score: number;
    flags: string[];
    action: string;
    created_at: string;
  }>;

  // Resolve property IDs for listing flags
  const propertyIds = items
    .filter((f) => f.entity_type === 'listing' && !f.entity_id.startsWith('draft:'))
    .map((f) => f.entity_id);

  const propertyMap = new Map<string, string>();
  if (propertyIds.length > 0) {
    const { data: props } = await service
      .from('properties')
      .select('id, title')
      .in('id', propertyIds);
    (props ?? []).forEach((p: { id: string; title: string }) => propertyMap.set(p.id, p.title));
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Flag size={22} className="text-red-400" /> Fraud Review Queue
        </h1>
        <p className="text-stone-400 text-sm mt-1">
          {items.length} unreviewed flag{items.length !== 1 ? 's' : ''}
        </p>
      </div>

      {items.length === 0 ? (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl p-12 text-center">
          <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
          <p className="text-white font-semibold">All clear</p>
          <p className="text-stone-500 text-sm mt-1">No unreviewed fraud flags.</p>
        </div>
      ) : (
        <div className="bg-stone-900 border border-stone-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-stone-800">
            {items.map((flag) => {
              const isDraftListing = flag.entity_type === 'listing' && flag.entity_id.startsWith('draft:');
              const propertyTitle = !isDraftListing ? propertyMap.get(flag.entity_id) : null;
              const propertyId = !isDraftListing && flag.entity_type === 'listing' ? flag.entity_id : null;

              return (
                <div key={flag.id} className="p-5 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ScoreBadge score={flag.fraud_score} />
                      <span className="text-white text-sm font-medium capitalize">{flag.entity_type}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        flag.action === 'reject' ? 'bg-red-500/20 text-red-400' :
                        flag.action === 'review' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {flag.action}
                      </span>
                    </div>

                    {propertyTitle && (
                      <p className="text-stone-300 text-sm font-medium truncate">{propertyTitle}</p>
                    )}
                    <p className="text-stone-500 text-xs font-mono truncate">{flag.entity_id}</p>

                    {flag.flags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {flag.flags.map((f: string) => (
                          <span key={f} className="bg-stone-800 border border-stone-700 text-stone-400 px-2 py-0.5 rounded text-xs">
                            {f}
                          </span>
                        ))}
                      </div>
                    )}

                    <time className="text-stone-600 text-xs">
                      {new Date(flag.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </time>
                  </div>

                  <div className="flex items-center shrink-0">
                    <FraudActions flagId={flag.id} propertyId={propertyId} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
