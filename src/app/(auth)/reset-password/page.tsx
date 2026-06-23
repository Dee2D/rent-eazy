'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { validatePassword } from '@/lib/security';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword]   = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [done, setDone]           = useState(false);

  const passwordsMatch = confirmPw === '' || password === confirmPw;

  const inputCls =
    'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
    'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
    'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError(updateError.message ?? 'Failed to update password. Please try again.');
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 3000);
  }

  if (done) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Password updated!</h2>
          <p className="text-stone-500 dark:text-slate-400 mb-8">
            Your password has been changed. Redirecting you to sign in…
          </p>
          <Link
            href="/login"
            className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Sign In
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
          <p className="text-stone-500 dark:text-slate-400 mt-2">Choose a new password</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 mb-6 text-sm" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300"
                aria-label={showPw ? 'Hide password' : 'Show password'}
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className={`${inputCls} ${!passwordsMatch ? 'ring-2 ring-red-400 border-red-300' : ''}`}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            {!passwordsMatch && (
              <p className="text-xs mt-1 text-red-500">Passwords do not match.</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !passwordsMatch}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Updating…' : 'Update Password'}
          </button>
        </form>

        <p className="text-center text-stone-500 dark:text-slate-400 text-sm mt-6">
          <Link href="/login" className="text-orange-500 hover:underline font-medium">
            Back to Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
