'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminReport } from '@/lib/supabase/admin';

export default function ReportsPanel({ reports: initial }: { reports: AdminReport[] }) {
  const router = useRouter();
  const [reports, setReports] = useState(initial);
  const [loading, setLoading] = useState<string | null>(null);

  async function updateStatus(id: string, status: 'resolved' | 'dismissed') {
    setLoading(id);
    const res = await fetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      setReports((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    }
    setLoading(null);
  }

  if (reports.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 divide-y divide-stone-100 dark:divide-slate-700">
      {reports.map((r) => (
        <div key={r.id} className="px-5 py-4 flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-stone-800 dark:text-slate-100 capitalize">
              {r.type.replace(/_/g, ' ')}
              <span className="ml-2 text-stone-400 dark:text-slate-500 font-normal capitalize">· {r.target_type}</span>
            </p>
            <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 line-clamp-2">{r.reason}</p>
            <p className="text-xs text-stone-300 dark:text-slate-600 mt-1">
              {new Date(r.created_at).toLocaleDateString('en-UG', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => updateStatus(r.id, 'resolved')}
              disabled={loading === r.id}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50"
            >
              Resolve
            </button>
            <button
              onClick={() => updateStatus(r.id, 'dismissed')}
              disabled={loading === r.id}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-700 text-stone-500 dark:text-slate-400 font-medium hover:bg-stone-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
