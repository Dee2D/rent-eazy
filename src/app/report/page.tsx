'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'fake_listing',      label: 'Fake or fraudulent property listing' },
  { value: 'abusive_provider',  label: 'Abusive or dishonest service provider' },
  { value: 'other',             label: 'Other concern' },
] as const;

const TARGET_TYPES = [
  { value: 'property', label: 'Property listing' },
  { value: 'provider', label: 'Service provider' },
] as const;

const REASON_OPTIONS = [
  'The listing price is misleading or false',
  'The photos do not match the actual property',
  'The property does not exist at the stated location',
  'The landlord/agent is demanding upfront money fraudulently',
  'The service provider behaved abusively or unprofessionally',
  'The provider did not deliver the promised service',
  'Spam or duplicate listing',
  'Other',
];

const inputCls =
  'w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl ' +
  'bg-white dark:bg-slate-700 text-stone-900 dark:text-white ' +
  'placeholder:text-stone-400 dark:placeholder:text-slate-500 ' +
  'focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors text-sm';

export default function ReportPage() {
  const [type, setType]           = useState<string>('fake_listing');
  const [targetType, setTargetType] = useState<string>('property');
  const [targetId, setTargetId]   = useState('');
  const [reason, setReason]       = useState('');
  const [details, setDetails]     = useState('');
  const [loading, setLoading]     = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason) { setError('Please select a reason.'); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, target_id: targetId.trim(), target_type: targetType, reason, details }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? 'Something went wrong.'); }
      else { setSubmitted(true); }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-orange-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
          <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Report Received</h2>
          <p className="text-stone-500 dark:text-slate-400 text-sm mb-6">
            Thank you for helping keep Rent Eazy safe. Our team will review your report within 3 business days and take appropriate action.
          </p>
          <Link
            href="/"
            className="inline-block w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-10">
      <div className="mb-6">
        <Link href="/" className="text-orange-500 hover:underline text-sm font-medium">← Back</Link>
        <div className="flex items-center gap-2 mt-4 mb-1">
          <AlertTriangle className="text-orange-500 shrink-0" size={22} />
          <h1 className="text-2xl font-bold text-stone-900 dark:text-white">Report a Concern</h1>
        </div>
        <p className="text-stone-500 dark:text-slate-400 text-sm">
          Help us keep Rent Eazy safe and trustworthy. Reports are reviewed within 3 business days.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl p-3 mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 p-6">

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-2">
            What are you reporting?
          </label>
          <div className="space-y-2">
            {REPORT_TYPES.map((rt) => (
              <label key={rt.value} className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-stone-100 dark:border-slate-700 hover:border-orange-300 dark:hover:border-orange-700 transition-colors">
                <input
                  type="radio"
                  name="type"
                  value={rt.value}
                  checked={type === rt.value}
                  onChange={(e) => setType(e.target.value)}
                  className="accent-orange-500 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-stone-700 dark:text-slate-300">{rt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Target type */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-2">
            You are reporting a…
          </label>
          <select
            value={targetType}
            onChange={(e) => setTargetType(e.target.value)}
            className={inputCls}
          >
            {TARGET_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        {/* Target ID */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
            Listing or Profile URL / ID{' '}
            <span className="text-stone-400 dark:text-slate-500 font-normal">(paste the page URL if possible)</span>
          </label>
          <input
            type="text"
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className={inputCls}
            placeholder="e.g. https://rent-eazy.vercel.app/properties/abc-123"
            required
          />
        </div>

        {/* Reason */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-2">
            Reason <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {REASON_OPTIONS.map((r) => (
              <label key={r} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-orange-500 w-4 h-4 shrink-0"
                />
                <span className="text-sm text-stone-600 dark:text-slate-400">{r}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Details */}
        <div>
          <label className="block text-sm font-medium text-stone-700 dark:text-slate-200 mb-1">
            Additional details{' '}
            <span className="text-stone-400 dark:text-slate-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            className={`${inputCls} resize-none`}
            rows={4}
            maxLength={2000}
            placeholder="Describe what happened in as much detail as possible…"
          />
          <p className="text-xs text-stone-400 dark:text-slate-600 text-right mt-1">{details.length}/2000</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
        >
          {loading ? 'Submitting…' : 'Submit Report'}
        </button>

        <p className="text-xs text-stone-400 dark:text-slate-600 text-center leading-relaxed">
          False reports may result in account suspension. All reports are handled confidentially.
        </p>
      </form>
    </div>
  );
}
