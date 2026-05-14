'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    // Always show the success screen regardless of whether the email exists
    // (prevents email enumeration)
    if (error && !error.message.includes('rate')) {
      setSent(true); // don't reveal if email exists or not
    } else if (error) {
      setError('Too many requests. Please wait before trying again.');
    } else {
      setSent(true);
    }
    setLoading(false);

    // 60-second cooldown to prevent reset email spam
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  const inputCls =
    'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
    'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
    'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors';

  if (sent) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">
            Check your inbox
          </h2>
          <p className="text-stone-500 dark:text-slate-400 mb-1">
            If an account exists for
          </p>
          <p className="font-semibold text-stone-800 dark:text-slate-200 mb-6">{email}</p>
          <p className="text-stone-400 dark:text-slate-500 text-sm mb-8">
            you&apos;ll receive a password reset link shortly.
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orange-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8">

        <div className="text-center mb-8">
          <h1
            className="text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
          >
            <span className="text-stone-900 dark:text-white">Rent </span>
            <span className="text-orange-500">Eazy</span>
          </h1>
          <p className="text-stone-500 dark:text-slate-400 mt-2">
            Reset your password
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
            />
          </div>

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-center text-stone-500 dark:text-slate-400 text-sm mt-6">
          Remembered it?{' '}
          <Link href="/login" className="text-orange-500 hover:underline font-medium">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
