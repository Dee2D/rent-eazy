'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatUGX, formatPeriod } from '@/lib/utils';
import type { Property } from '@/types';

type ListingStatus = 'active' | 'taken' | 'expired' | 'pending';

function getStatus(p: Property): ListingStatus {
  if (!p.expires_at && !p.is_active) return 'pending';
  const expiresAt = p.expires_at ? new Date(p.expires_at) : null;
  const expired = expiresAt ? expiresAt < new Date() : false;
  if (p.is_active && !expired) return 'active';
  if (!p.is_active && expiresAt && !expired) return 'taken';
  return 'expired';
}

const STATUS_STYLES: Record<ListingStatus, string> = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  taken: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  expired: 'bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400',
  pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
};

const STATUS_LABELS: Record<ListingStatus, string> = {
  active: 'Active',
  taken: 'Taken',
  expired: 'Expired',
  pending: 'Pending Payment',
};

interface ListingCardProps {
  property: Property;
  userId: string;
  onMarkTaken: (id: string) => Promise<void>;
  onRenew: (property: Property) => void;
}

export default function ListingCard({ property: p, onMarkTaken, onRenew }: ListingCardProps) {
  const [marking, setMarking] = useState(false);
  const status = getStatus(p);

  async function handleMarkTaken() {
    setMarking(true);
    try {
      await onMarkTaken(p.id);
    } finally {
      setMarking(false);
    }
  }

  return (
    <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl p-4 shadow-sm transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <span className="text-xs text-stone-400 dark:text-slate-500 capitalize">{p.property_type}</span>
            {p.listing_type && (
              <span className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full capitalize">
                {p.listing_type}
              </span>
            )}
          </div>

          {/* Title & details */}
          <p className="font-semibold text-stone-900 dark:text-white text-sm truncate">{p.title}</p>
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
            {p.area_name}, {p.district} &bull; {formatUGX(p.price_ugx)}{formatPeriod(p.payment_period)}
          </p>
          {p.expires_at && (
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-0.5">
              {status === 'expired' ? 'Expired' : 'Expires'}:{' '}
              {new Date(p.expires_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap sm:flex-col gap-2 shrink-0">
          {status === 'active' && (
            <>
              <Link
                href={`/dashboard/add-property?edit=${p.id}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-orange-300 dark:hover:border-orange-500 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
              >
                Edit
              </Link>
              <button
                onClick={handleMarkTaken}
                disabled={marking}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-500 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
              >
                {marking ? '…' : 'Mark as Taken'}
              </button>
            </>
          )}
          {(status === 'expired' || status === 'pending') && (
            <button
              onClick={() => onRenew(p)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white transition-colors"
            >
              {status === 'pending' ? 'Pay Now' : 'Renew'}
            </button>
          )}
          {status === 'taken' && (
            <span className="text-xs text-stone-400 dark:text-slate-500 italic">Marked as taken</span>
          )}
        </div>
      </div>
    </div>
  );
}
