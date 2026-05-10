'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      router.refresh();
      router.push(profile?.role === 'admin' ? '/admin' : '/dashboard');
    }
  }

  const inputCls =
    'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
    'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
    'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors';

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
            Welcome back — sign in to your account
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
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-sm font-medium text-stone-700 dark:text-slate-200">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-orange-500 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-stone-500 dark:text-slate-400 text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-orange-500 hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
