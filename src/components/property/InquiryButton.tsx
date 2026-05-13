'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  propertyId: string;
  propertyTitle: string;
}

export default function InquiryButton({ propertyId, propertyTitle }: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function send() {
    if (message.trim().length < 10) {
      setError('Please write at least 10 characters.');
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch(`/api/inquiries/${propertyId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (res.status === 401) {
      router.push('/login');
      return;
    }

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to send inquiry');
      return;
    }

    setSent(true);
    setMessage('');
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-stone-100 dark:bg-slate-700 hover:bg-stone-200 dark:hover:bg-slate-600 text-stone-700 dark:text-slate-200 rounded-xl text-sm font-semibold transition-colors"
      >
        <MessageCircle size={16} /> Send Inquiry
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-stone-900 dark:text-white text-lg">Send Inquiry</h3>
              <button onClick={() => { setOpen(false); setSent(false); setError(null); }} className="text-stone-400 hover:text-stone-600 dark:hover:text-slate-200">
                <X size={20} />
              </button>
            </div>

            {sent ? (
              <div className="text-center py-6">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
                <p className="font-semibold text-stone-900 dark:text-white">Inquiry sent!</p>
                <p className="text-stone-500 dark:text-slate-400 text-sm mt-1">The landlord will see your message in their dashboard.</p>
                <button
                  onClick={() => { setOpen(false); setSent(false); }}
                  className="mt-4 text-sm text-orange-500 hover:underline"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="text-stone-500 dark:text-slate-400 text-sm mb-4">
                  Inquiring about: <span className="font-medium text-stone-700 dark:text-slate-200 line-clamp-1">{propertyTitle}</span>
                </p>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Hi, I'm interested in this property. Is it still available? When can I schedule a viewing?"
                  rows={4}
                  maxLength={1000}
                  className="w-full border border-stone-200 dark:border-slate-600 rounded-xl px-4 py-3 text-sm text-stone-900 dark:text-white bg-white dark:bg-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 placeholder-stone-300 dark:placeholder-slate-500"
                />
                <p className="text-xs text-stone-400 dark:text-slate-500 text-right mt-1">{message.length}/1000</p>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <button
                  onClick={send}
                  disabled={loading}
                  className="mt-4 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
                >
                  {loading ? 'Sending…' : <><Send size={15} /> Send Message</>}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
