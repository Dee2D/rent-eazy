'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatUGX } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  type: 'listing' | 'subscription';
  referenceId: string;
  phoneNumber?: string;
  // userId kept in props for backward compatibility but NOT sent to server
  userId?: string;
}

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  type,
  referenceId,
  phoneNumber = '',
}: PaymentModalProps) {
  const [phone, setPhone] = useState(phoneNumber);
  const [provider, setProvider] = useState<'mtn' | 'airtel'>('mtn');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function isValidPhone(p: string): boolean {
    const digits = p.replace(/[\s\-\+\(\)]/g, '');
    return /^(256[0-9]{9}|0[0-9]{9})$/.test(digits);
  }

  async function handlePay() {
    if (!isValidPhone(phone)) {
      setError('Enter a valid Uganda phone number (e.g. 0701234567 or +256701234567)');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // userId and amount are intentionally NOT sent — the server derives them
      // from the session and constants respectively to prevent client-side spoofing.
      const res = await fetch('/api/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, referenceId, phoneNumber: phone, provider }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Payment failed');

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setLoading(false);
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setSuccess(false);
      setError(null);
      onClose();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Mobile Money Payment">
      {success ? (
        <div className="flex flex-col items-center gap-3 py-6">
          <CheckCircle size={52} className="text-green-500" />
          <p className="text-lg font-semibold text-stone-900 dark:text-white">Payment Successful!</p>
          <p className="text-sm text-stone-500 dark:text-slate-400">
            {type === 'listing' ? 'Your listing is now active.' : 'Your subscription is now active.'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 text-center">
            <p className="text-sm text-stone-500 dark:text-slate-400">Amount to Pay</p>
            <p className="text-2xl font-bold text-orange-500">{formatUGX(amount)}</p>
            <p className="text-xs text-stone-400 dark:text-slate-500 mt-1">
              {type === 'listing' ? '3-month listing fee' : '30-day subscription'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Mobile Money Provider</label>
            <div className="grid grid-cols-2 gap-2">
              {(['mtn', 'airtel'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProvider(p)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                    provider === p
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-600'
                      : 'border-stone-200 dark:border-slate-600 text-stone-600 dark:text-slate-300 hover:border-stone-300 dark:hover:border-slate-500'
                  }`}
                >
                  {p === 'mtn' ? '📱 MTN MoMo' : '📱 Airtel Money'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+256 700 000000"
              autoComplete="tel"
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-700 text-stone-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm placeholder:text-stone-400 dark:placeholder:text-slate-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 rounded-xl p-3 text-sm">
              {error}
              <button onClick={handlePay} className="ml-2 underline">Retry</button>
            </div>
          )}

          <button
            onClick={handlePay}
            disabled={loading || !phone}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? '⏳ Processing payment…' : `Pay ${formatUGX(amount)}`}
          </button>
        </div>
      )}
    </Modal>
  );
}
