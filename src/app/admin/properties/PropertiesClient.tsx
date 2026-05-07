'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle, XCircle, Home, Trash2 } from 'lucide-react';
import type { AdminProperty } from '@/lib/supabase/admin';
import { formatUGX } from '@/lib/utils';

type Filter = 'all' | 'active' | 'expired' | 'taken' | 'inactive';

function getStatus(p: AdminProperty): Filter {
  if (p.is_taken) return 'taken';
  if (p.is_active) return 'active';
  if (p.expires_at && new Date(p.expires_at) < new Date()) return 'expired';
  return 'inactive';
}

function StatusBadge({ p }: { p: AdminProperty }) {
  const s = getStatus(p);
  const map: Record<string, string> = {
    active:   'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
    expired:  'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
    taken:    'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
    inactive: 'bg-stone-100  text-stone-500  dark:bg-slate-700     dark:text-slate-400',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${map[s]}`}>{s}</span>
  );
}

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: 'all',      label: 'All' },
  { key: 'active',   label: 'Active' },
  { key: 'expired',  label: 'Expired' },
  { key: 'taken',    label: 'Taken' },
  { key: 'inactive', label: 'Inactive' },
];

export default function PropertiesClient({ properties }: { properties: AdminProperty[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>('all');
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);

  const filtered = filter === 'all' ? properties : properties.filter((p) => getStatus(p) === filter);

  async function doAction(id: string, action: 'activate' | 'deactivate' | 'mark_taken' | 'delete') {
    setActionId(id);
    await fetch(`/api/admin/properties/${id}`, {
      method: action === 'delete' ? 'DELETE' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: action !== 'delete' ? JSON.stringify({ action }) : undefined,
    });
    setActionId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {FILTER_LABELS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              filter === key
                ? 'bg-orange-500 text-white'
                : 'bg-white dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 hover:border-orange-300'
            }`}
          >
            {label}
            <span className="ml-1.5 text-xs opacity-70">
              {key === 'all' ? properties.length : properties.filter((p) => getStatus(p) === key).length}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Property</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Price</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Expires</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                    No properties found.
                  </td>
                </tr>
              )}
              {filtered.map((p) => {
                const busy = isPending && actionId === p.id;
                return (
                  <tr key={p.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800 dark:text-slate-100 truncate max-w-[180px]">{p.title}</p>
                      <p className="text-xs text-stone-400 dark:text-slate-500">{p.district} · {p.property_type}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-stone-600 dark:text-slate-300">
                      {p.profiles?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-stone-600 dark:text-slate-300">
                      {formatUGX(p.price_ugx)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge p={p} />
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-stone-400 dark:text-slate-500 text-xs">
                      {p.expires_at ? new Date(p.expires_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!p.is_active && !p.is_taken && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(p.id, 'activate')}
                            title="Activate"
                            className="p-1.5 rounded-lg text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 disabled:opacity-40 transition-colors"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {p.is_active && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(p.id, 'deactivate')}
                            title="Deactivate"
                            className="p-1.5 rounded-lg text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-40 transition-colors"
                          >
                            <XCircle size={15} />
                          </button>
                        )}
                        {!p.is_taken && (
                          <button
                            disabled={busy}
                            onClick={() => doAction(p.id, 'mark_taken')}
                            title="Mark as taken"
                            className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-40 transition-colors"
                          >
                            <Home size={15} />
                          </button>
                        )}
                        <button
                          disabled={busy}
                          onClick={() => {
                            if (confirm('Delete this property permanently?')) doAction(p.id, 'delete');
                          }}
                          title="Delete"
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
