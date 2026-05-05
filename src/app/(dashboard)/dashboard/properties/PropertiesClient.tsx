'use client';

import { useState } from 'react';
import Link from 'next/link';
import PaymentModal from '@/components/payment/PaymentModal';
import ListingCard from '@/components/property/ListingCard';
import { createClient } from '@/lib/supabase/client';
import type { Property } from '@/types';

const LISTING_FEE = 10_000;

export default function PropertiesClient({ properties: initial, userId }: { properties: Property[]; userId: string }) {
  const [properties, setProperties] = useState<Property[]>(initial);
  const [renewTarget, setRenewTarget] = useState<Property | null>(null);

  async function handleMarkTaken(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('properties')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      setProperties((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active: false } : p))
      );
    }
  }

  if (properties.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-slate-500">
        <span className="text-6xl mb-4">🏚️</span>
        <p className="text-lg font-medium">No properties yet</p>
        <Link
          href="/dashboard/add-property"
          className="mt-4 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Add Your First Property
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {properties.map((p) => (
          <ListingCard
            key={p.id}
            property={p}
            userId={userId}
            onMarkTaken={handleMarkTaken}
            onRenew={setRenewTarget}
          />
        ))}
      </div>

      {renewTarget && (
        <PaymentModal
          isOpen
          onClose={() => setRenewTarget(null)}
          onSuccess={() => { setRenewTarget(null); window.location.reload(); }}
          amount={LISTING_FEE}
          type="listing"
          referenceId={renewTarget.id}
          userId={userId}
        />
      )}
    </>
  );
}
