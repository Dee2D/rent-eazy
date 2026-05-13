'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  propertyId: string;
  initialSaved: boolean;
  checkOnMount?: boolean;
  className?: string;
}

export default function SaveButton({ propertyId, initialSaved, checkOnMount = false, className = '' }: Props) {
  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(checkOnMount);
  const router = useRouter();

  useEffect(() => {
    if (!checkOnMount) return;
    fetch(`/api/saved/${propertyId}`)
      .then((r) => r.json())
      .then(({ saved: s }) => { setSaved(s); setLoading(false); })
      .catch(() => setLoading(false));
  }, [propertyId, checkOnMount]);

  async function toggle() {
    setLoading(true);
    const method = saved ? 'DELETE' : 'POST';
    const res = await fetch(`/api/saved/${propertyId}`, { method });
    if (res.status === 401) {
      router.push('/login');
      return;
    }
    if (res.ok) setSaved((v) => !v);
    setLoading(false);
  }

  return (
    <button
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(); }}
      disabled={loading}
      aria-label={saved ? 'Remove from saved' : 'Save property'}
      className={`inline-flex items-center justify-center rounded-full w-9 h-9 transition-colors disabled:opacity-50 ${
        saved
          ? 'bg-orange-500 text-white hover:bg-orange-600'
          : 'bg-white/80 dark:bg-slate-800/80 text-stone-500 hover:text-orange-500 hover:bg-white dark:hover:bg-slate-700'
      } ${className}`}
    >
      <Heart size={16} className={saved ? 'fill-current' : ''} />
    </button>
  );
}
