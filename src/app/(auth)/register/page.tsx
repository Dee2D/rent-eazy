'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Eye, EyeOff, CheckCircle } from 'lucide-react';
import { validatePassword } from '@/lib/security';
import TermsCheckbox from '@/components/TermsCheckbox';
import dynamic from 'next/dynamic';
import type { UserRole } from '@/types';

const TurnstileWidget = dynamic(() => import('@/components/security/TurnstileWidget'), { ssr: false });

type PasswordStrength = 'weak' | 'fair' | 'strong';

function getPasswordStrength(pw: string): PasswordStrength {
  const hasUpper   = /[A-Z]/.test(pw);
  const hasDigit   = /\d/.test(pw);
  const hasSpecial = /[^A-Za-z0-9]/.test(pw);
  const score = [pw.length >= 8, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
  if (score <= 1) return 'weak';
  if (score <= 2) return 'fair';
  return 'strong';
}

const strengthMeta: Record<PasswordStrength, { color: string; width: string; label: string }> = {
  weak:   { color: 'bg-red-400',    width: 'w-1/3',  label: 'Weak' },
  fair:   { color: 'bg-yellow-400', width: 'w-2/3',  label: 'Fair' },
  strong: { color: 'bg-green-500',  width: 'w-full', label: 'Strong' },
};

export default function RegisterPage() {
  const [fullName, setFullName]           = useState('');
  const [email, setEmail]                 = useState('');
  const [phone, setPhone]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPw, setConfirmPw]         = useState('');
  const [role, setRole]                   = useState<UserRole>('tenant');
  const [showPw, setShowPw]               = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [emailSent, setEmailSent]         = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const turnstileTokenRef = useRef<string>('');
  const onTurnstileVerify = useCallback((token: string) => { turnstileTokenRef.current = token; }, []);
  const onTurnstileExpire = useCallback(() => { turnstileTokenRef.current = ''; }, []);

  const strength       = password ? getPasswordStrength(password) : null;
  const passwordsMatch = confirmPw === '' || password === confirmPw;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!termsAccepted) {
      setError('You must accept the Terms & Conditions and Privacy Policy to continue.');
      return;
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.');
      return;
    }
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }

    setLoading(true);
    setError(null);

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName,
        email,
        phone: phone || null,
        password,
        role,
        acceptedTerms: true,
        acceptedTermsAt: new Date().toISOString(),
        turnstileToken: turnstileTokenRef.current,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok || !data.success) {
      setError(data.error ?? 'Registration failed. Please try again.');
      turnstileTokenRef.current = '';
      return;
    }

    if (data.requiresConfirmation) {
      setEmailSent(true);
    }
  }

  const inputCls =
    'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
    'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
    'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors';

  if (emailSent) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 dark:text-white mb-2">Check your inbox</h2>
          <p className="text-stone-500 dark:text-slate-400 mb-1">We sent a confirmation link to</p>
          <p className="font-semibold text-stone-800 dark:text-slate-200 mb-6">{email}</p>
          <p className="text-stone-400 dark:text-slate-500 text-sm mb-8">
            Click the link in the email to activate your account. If you don&apos;t see it, check your spam folder.
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
          <p className="text-stone-500 dark:text-slate-400 mt-2">Create your account — it&apos;s free</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Full Name</label>
            <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputCls} placeholder="John Doe" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="you@example.com" autoComplete="email" autoCapitalize="none" spellCheck={false} />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
              Phone <span className="text-stone-400 dark:text-slate-500 font-normal">(optional)</span>
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+256 700 000000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {strength && (
              <div className="mt-2">
                <div className="h-1.5 w-full bg-stone-100 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${strengthMeta[strength].color} ${strengthMeta[strength].width}`} />
                </div>
                <p className="text-xs mt-1 text-stone-400 dark:text-slate-500">{strengthMeta[strength].label} password</p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                required minLength={8}
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className={`${inputCls} pr-11 ${!passwordsMatch ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                placeholder="••••••••"
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300" aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {!passwordsMatch && <p className="text-xs mt-1 text-red-500">Passwords do not match.</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">I am a…</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={`${inputCls} bg-white dark:bg-slate-700`}>
              <option value="tenant">Tenant — looking for a place</option>
              <option value="landlord">Landlord — listing properties</option>
              <option value="provider">Service Provider — offering services</option>
            </select>
          </div>

          <TermsCheckbox checked={termsAccepted} onChange={setTermsAccepted} />

          <TurnstileWidget onVerify={onTurnstileVerify} onExpire={onTurnstileExpire} />

          <button
            type="submit"
            disabled={loading || !passwordsMatch || !termsAccepted}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-stone-500 dark:text-slate-400 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-orange-500 hover:underline font-medium">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
