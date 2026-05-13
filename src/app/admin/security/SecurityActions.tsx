'use client';

import { useState } from 'react';
import { Ban, Unlock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SecurityActionsProps {
  ipAddress: string;
  action: 'block' | 'unblock';
}

export default function SecurityActions({ ipAddress, action }: SecurityActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleAction() {
    if (loading || done) return;
    const label = action === 'block' ? 'block' : 'unblock';
    if (!confirm(`Are you sure you want to ${label} ${ipAddress}?`)) return;

    setLoading(true);
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action,
        ipAddress,
        reason: action === 'block' ? 'Manually blocked by admin' : undefined,
      }),
    });

    setLoading(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  if (action === 'block') {
    return (
      <button
        onClick={handleAction}
        disabled={loading || done}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-lg disabled:opacity-50 transition-colors"
      >
        <Ban size={12} />
        {loading ? 'Blocking…' : done ? 'Blocked' : 'Block IP'}
      </button>
    );
  }

  return (
    <button
      onClick={handleAction}
      disabled={loading || done}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 rounded-lg disabled:opacity-50 transition-colors"
    >
      <Unlock size={12} />
      {loading ? 'Unblocking…' : done ? 'Unblocked' : 'Unblock'}
    </button>
  );
}
