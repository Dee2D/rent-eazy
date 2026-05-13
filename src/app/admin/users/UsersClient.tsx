'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AdminUser } from '@/lib/supabase/admin';
import type { UserRole } from '@/types';

const ROLES: UserRole[] = ['tenant', 'landlord', 'provider', 'admin'];

const roleColors: Record<string, string> = {
  admin:    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  landlord: 'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  provider: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  tenant:   'bg-stone-100  text-stone-600  dark:bg-slate-700     dark:text-slate-300',
};

export default function UsersClient({ users }: { users: AdminUser[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionId, setActionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const filtered = users.filter((u) =>
    u.full_name.toLowerCase().includes(search.toLowerCase())
  );

  async function changeRole(id: string, role: UserRole) {
    setActionId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'change_role', role }),
    });
    setActionId(null);
    startTransition(() => router.refresh());
  }

  async function toggleDeactivate(id: string, currentRole: string) {
    const action = currentRole === 'deactivated' ? 'reactivate' : 'deactivate';
    setActionId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    setActionId(null);
    startTransition(() => router.refresh());
  }

  async function banUser(id: string) {
    if (!confirm('Ban this user? All their listings will be deactivated immediately.')) return;
    setActionId(id);
    await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ban' }),
    });
    setActionId(null);
    startTransition(() => router.refresh());
  }

  return (
    <div className="space-y-4">
      <input
        type="search"
        placeholder="Search by name…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-xs px-4 py-2 text-sm rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400"
      />

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-100 dark:border-slate-700 bg-stone-50 dark:bg-slate-700/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden xl:table-cell">Terms</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-stone-500 dark:text-slate-400 uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-slate-700">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-stone-400 dark:text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
              {filtered.map((u) => {
                const busy = isPending && actionId === u.id;
                return (
                  <tr key={u.id} className="hover:bg-stone-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-stone-800 dark:text-slate-100">{u.full_name}</p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-stone-500 dark:text-slate-400">
                      {u.phone_number ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${roleColors[u.role] ?? roleColors.tenant}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {u.accepted_terms ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
                          <span aria-hidden>✓</span> Accepted
                        </span>
                      ) : (
                        <span className="text-xs text-stone-400 dark:text-slate-500">Pending</span>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-stone-400 dark:text-slate-500">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <select
                          disabled={busy}
                          value={u.role}
                          onChange={(e) => changeRole(u.id, e.target.value as UserRole)}
                          className="text-xs px-2 py-1.5 rounded-lg border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-stone-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-400 disabled:opacity-40"
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                        <button
                          disabled={busy}
                          onClick={() => toggleDeactivate(u.id, u.role)}
                          className="text-xs px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                        >
                          {u.role === 'deactivated' ? 'Reactivate' : 'Deactivate'}
                        </button>
                        {u.role !== 'deactivated' && u.role !== 'admin' && (
                          <button
                            disabled={busy}
                            onClick={() => banUser(u.id)}
                            className="text-xs px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition-colors"
                          >
                            Ban
                          </button>
                        )}
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
