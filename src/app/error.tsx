'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span className="text-6xl mb-4">⚠️</span>
      <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Something went wrong</h2>
      <p className="text-stone-500 dark:text-slate-400 text-sm mb-6 max-w-xs">{error.message || 'An unexpected error occurred.'}</p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="border border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-500 text-sm font-medium px-5 py-2.5 rounded-xl transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
