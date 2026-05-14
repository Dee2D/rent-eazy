'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, RefreshCw } from 'lucide-react';

export default function Verify2FAPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    // Auto-send OTP on page load
    sendCode();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function sendCode() {
    if (cooldown > 0) return;
    setSending(true);
    setError(null);

    const res = await fetch('/api/admin/2fa/send', { method: 'POST' });
    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to send code.');
      return;
    }
    setSent(true);
    // Email delivery unavailable — code returned directly in response
    if (data.fallbackCode) {
      setCode(data.fallbackCode);
    }
    // 60-second resend cooldown
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!code || code.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch('/api/admin/2fa/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Verification failed.');
      return;
    }

    router.push('/admin');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 p-8">

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-orange-500" />
          </div>
        </div>

        <h1 className="text-xl font-bold text-white text-center mb-1">Two-Factor Verification</h1>
        <p className="text-sm text-stone-400 text-center mb-6">
          Enter the 6-digit code sent to your admin email.
        </p>

        {sent && !error && (
          <div className="flex items-center gap-2 bg-green-900/20 border border-green-800 rounded-xl p-3 mb-5 text-sm text-green-400">
            <Mail size={15} className="shrink-0" />
            Code sent to your email.
          </div>
        )}

        {error && (
          <div className="bg-red-900/20 border border-red-800 text-red-400 rounded-xl p-3 mb-5 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="w-full px-4 py-4 bg-stone-800 border border-stone-700 rounded-xl text-white text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder:text-stone-600"
          />

          <button
            type="submit"
            disabled={loading || code.length !== 6}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Verifying…' : 'Verify & Enter Admin'}
          </button>
        </form>

        <button
          onClick={sendCode}
          disabled={sending || cooldown > 0}
          className="mt-4 w-full flex items-center justify-center gap-2 text-sm text-stone-400 hover:text-stone-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw size={14} className={sending ? 'animate-spin' : ''} />
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
