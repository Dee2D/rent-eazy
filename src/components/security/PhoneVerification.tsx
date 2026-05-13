'use client';

import { useState } from 'react';
import { Phone, CheckCircle, Loader2 } from 'lucide-react';

interface PhoneVerificationProps {
  initialPhone?: string;
  isVerified?: boolean;
  onVerified?: (phone: string) => void;
}

type Step = 'phone' | 'otp' | 'done';

export default function PhoneVerification({ initialPhone = '', isVerified = false, onVerified }: PhoneVerificationProps) {
  const [step, setStep]         = useState<Step>(isVerified ? 'done' : 'phone');
  const [phone, setPhone]       = useState(initialPhone);
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  if (step === 'done') {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
        <CheckCircle size={20} className="text-green-500 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-green-800 dark:text-green-300">Phone verified</p>
          <p className="text-xs text-green-600 dark:text-green-400">{phone}</p>
        </div>
      </div>
    );
  }

  function startCooldown() {
    setCooldown(60);
    const interval = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function sendOTP() {
    if (cooldown > 0) return;
    setLoading(true);
    setError(null);

    const res = await fetch('/api/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to send OTP.');
      return;
    }
    setStep('otp');
    startCooldown();
  }

  async function verifyOTP() {
    setLoading(true);
    setError(null);

    const res = await fetch('/api/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Verification failed.');
      return;
    }

    setStep('done');
    onVerified?.(phone);
  }

  const inputCls =
    'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
    'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
    'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
    'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors text-sm';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Phone size={16} className="text-orange-500" />
        <h3 className="text-sm font-semibold text-stone-700 dark:text-slate-200">Phone Verification</h3>
        <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-medium">Required</span>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
          {error}
        </div>
      )}

      {step === 'phone' && (
        <div className="space-y-3">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256 700 000000"
            className={inputCls}
            autoComplete="tel"
          />
          <button
            onClick={sendOTP}
            disabled={loading || !phone}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Sending…' : 'Send Verification Code'}
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="space-y-3">
          <p className="text-xs text-stone-500 dark:text-slate-400">
            Enter the 6-digit code sent to {phone}.
          </p>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className={`${inputCls} text-center text-xl font-mono tracking-widest`}
          />
          <button
            onClick={verifyOTP}
            disabled={loading || code.length !== 6}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            {loading ? 'Verifying…' : 'Verify Code'}
          </button>
          <button
            onClick={sendOTP}
            disabled={loading || cooldown > 0}
            className="w-full text-sm text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300 disabled:opacity-50 transition-colors"
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}
    </div>
  );
}
