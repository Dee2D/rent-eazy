'use client';

import { useState } from 'react';
import { Send, Eye, CheckCircle, AlertCircle } from 'lucide-react';
import type { ReportPeriod } from '@/lib/email/report';

export default function SendReportButton() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function send(period: ReportPeriod) {
    setStatus('sending');
    setMessage('');
    const res = await fetch('/api/admin/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period }),
    });
    const json = await res.json();
    if (res.ok) {
      setStatus('success');
      setMessage(`${period === 'daily' ? 'Daily' : 'Weekly'} report sent to your email.`);
    } else {
      setStatus('error');
      setMessage(json.error ?? 'Failed to send report.');
    }
    setTimeout(() => setStatus('idle'), 4000);
  }

  async function preview(period: ReportPeriod) {
    const res = await fetch('/api/admin/send-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period, preview: true }),
    });
    const html = await res.text();
    const win = window.open('', '_blank');
    win?.document.write(html);
    win?.document.close();
  }

  const busy = status === 'sending';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-stone-100 dark:border-slate-700 p-5">
      <h2 className="text-sm font-semibold text-stone-700 dark:text-slate-200 mb-1">Email Reports</h2>
      <p className="text-xs text-stone-400 dark:text-slate-500 mb-4">
        Send an analytics report to <span className="font-mono">{process.env.NEXT_PUBLIC_ADMIN_EMAIL_HINT ?? 'your admin email'}</span>
      </p>

      <div className="flex flex-wrap gap-3">
        {(['daily', 'weekly'] as ReportPeriod[]).map((period) => (
          <div key={period} className="flex items-center gap-1.5">
            <button
              disabled={busy}
              onClick={() => send(period)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-50 transition-colors"
            >
              <Send size={14} />
              Send {period === 'daily' ? 'Daily' : 'Weekly'}
            </button>
            <button
              disabled={busy}
              onClick={() => preview(period)}
              title="Preview report"
              className="p-2 rounded-xl text-stone-500 hover:text-stone-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              <Eye size={14} />
            </button>
          </div>
        ))}
      </div>

      {status === 'success' && (
        <div className="flex items-center gap-2 mt-3 text-sm text-green-600 dark:text-green-400">
          <CheckCircle size={15} /> {message}
        </div>
      )}
      {status === 'error' && (
        <div className="flex items-center gap-2 mt-3 text-sm text-red-500">
          <AlertCircle size={15} /> {message}
        </div>
      )}
      {status === 'sending' && (
        <p className="mt-3 text-sm text-stone-400 dark:text-slate-500">Sending report…</p>
      )}

      <p className="mt-4 text-xs text-stone-300 dark:text-slate-600">
        Auto-schedule: daily 07:00 UTC · weekly Monday 07:00 UTC (Vercel Cron)
      </p>
    </div>
  );
}
