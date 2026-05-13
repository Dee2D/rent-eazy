'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  flagId: string;
  propertyId: string | null;
}

export default function FraudActions({ flagId, propertyId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null);
  const [done, setDone] = useState(false);

  async function handle(action: 'approve' | 'reject') {
    setLoading(action);
    await fetch('/api/admin/fraud', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flagId, action, propertyId }),
    });
    setLoading(null);
    setDone(true);
    router.refresh();
  }

  if (done) {
    return <span className="text-stone-500 text-xs">Done</span>;
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('approve')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? '…' : 'Approve'}
      </button>
      <button
        onClick={() => handle('reject')}
        disabled={!!loading}
        className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? '…' : 'Reject & Delete'}
      </button>
    </div>
  );
}
