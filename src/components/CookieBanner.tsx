'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'rent_eazy_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (!stored) setVisible(true); // one-time SSR-safe localStorage init
    } catch {
      // localStorage unavailable (e.g., private browsing with strict settings)
    }
  }, []);

  function accept() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, ts: Date.now() })); } catch { /* */ }
    setVisible(false);
  }

  function acceptEssentialOnly() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, ts: Date.now() })); } catch { /* */ }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 md:bottom-4 md:left-auto md:right-4 md:max-w-sm"
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-stone-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xl" aria-hidden>🍪</span>
            <h2 className="font-bold text-stone-900 dark:text-white text-sm">Cookie Settings</h2>
          </div>

          <p className="text-xs text-stone-600 dark:text-slate-400 leading-relaxed mb-3">
            We use essential cookies to keep you logged in and analytics cookies to improve the platform.
            Your data is never sold.{' '}
            <Link href="/privacy-policy" className="text-orange-500 hover:underline">Learn more</Link>
          </p>

          {showDetails && (
            <div className="mb-4 space-y-3">
              <div className="p-3 bg-stone-50 dark:bg-slate-700/40 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold text-stone-700 dark:text-slate-300">Essential cookies</p>
                  <span className="text-xs text-stone-400 dark:text-slate-500 italic">Always on</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-slate-500">
                  Session management, authentication, and security. Required for the site to work.
                </p>
              </div>
              <div className="p-3 bg-stone-50 dark:bg-slate-700/40 rounded-xl">
                <p className="text-xs font-semibold text-stone-700 dark:text-slate-300 mb-1">Analytics cookies</p>
                <p className="text-xs text-stone-500 dark:text-slate-500">
                  Help us understand which pages are popular and how users navigate the site (anonymised).
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              onClick={accept}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors"
            >
              Accept All
            </button>
            <div className="flex gap-2">
              <button
                onClick={acceptEssentialOnly}
                className="flex-1 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-300 text-xs font-medium py-2 rounded-xl transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={() => setShowDetails((v) => !v)}
                className="flex-1 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-300 text-xs font-medium py-2 rounded-xl transition-colors"
              >
                {showDetails ? 'Hide Details' : 'Manage'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
