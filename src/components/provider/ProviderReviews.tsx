'use client';

import { useState } from 'react';
import { Star, Send } from 'lucide-react';
import type { ProviderReview } from '@/types';

interface Props {
  providerId: string;
  reviews: ProviderReview[];
  isAuthenticated: boolean;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          aria-label={`Rate ${s} star${s !== 1 ? 's' : ''}`}
        >
          <Star
            size={22}
            className={`transition-colors ${
              s <= (hover || value)
                ? 'fill-orange-400 text-orange-400'
                : 'text-stone-200 dark:text-slate-600'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: ProviderReview }) {
  const date = new Date(review.created_at).toLocaleDateString('en-UG', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="border-b border-stone-100 dark:border-slate-700 last:border-0 pb-5 last:pb-0 pt-5 first:pt-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-sm font-bold text-orange-600 dark:text-orange-400">
            {(review.profiles?.full_name ?? 'A')[0].toUpperCase()}
          </div>
          <span className="font-medium text-stone-800 dark:text-white text-sm">
            {review.profiles?.full_name ?? 'Anonymous'}
          </span>
        </div>
        <span className="text-xs text-stone-400 dark:text-slate-500">{date}</span>
      </div>
      <div className="flex gap-0.5 mb-2 ml-10">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            size={13}
            className={s <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-stone-200 dark:text-slate-600'}
          />
        ))}
      </div>
      {review.comment && (
        <p className="text-sm text-stone-600 dark:text-slate-400 leading-relaxed ml-10">
          {review.comment}
        </p>
      )}
    </div>
  );
}

export default function ProviderReviews({ providerId, reviews: initialReviews, isAuthenticated }: Props) {
  const [reviews, setReviews]   = useState(initialReviews);
  const [rating, setRating]     = useState(0);
  const [comment, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [success, setSuccess]   = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) { setError('Please choose a star rating.'); return; }
    setSubmitting(true);
    setError(null);

    const res = await fetch('/api/provider/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providerId, rating, comment }),
    });

    const json = await res.json() as { success?: boolean; error?: string };
    setSubmitting(false);

    if (!res.ok || !json.success) {
      setError(json.error ?? 'Failed to submit review. Please try again.');
      return;
    }

    setSuccess(true);
    setRating(0);
    setComment('');
    // Optimistic: add placeholder until next refresh
    setReviews((prev) => [
      {
        id: crypto.randomUUID(),
        provider_id: providerId,
        reviewer_id: '',
        rating,
        comment: comment.trim() || null,
        is_hidden: false,
        created_at: new Date().toISOString(),
        profiles: { full_name: 'You' },
      },
      ...prev,
    ]);
  }

  const avgRating = reviews.length
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  return (
    <section className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-semibold text-stone-900 dark:text-white text-lg">
          Reviews
          {reviews.length > 0 && (
            <span className="ml-2 text-sm font-normal text-stone-400 dark:text-slate-500">
              ({reviews.length})
            </span>
          )}
        </h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1.5">
            <Star size={15} className="fill-orange-400 text-orange-400" />
            <span className="font-semibold text-stone-800 dark:text-white text-sm">
              {avgRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-stone-400 dark:text-slate-500 mb-6">
          No reviews yet — be the first to leave one.
        </p>
      ) : (
        <div className="mb-8">
          {reviews.map((r) => <ReviewCard key={r.id} review={r} />)}
        </div>
      )}

      {/* Submission form */}
      {isAuthenticated ? (
        success ? (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl px-4 py-3 text-sm font-medium">
            Thank you! Your review has been submitted.
          </div>
        ) : (
          <form onSubmit={submit} className="border-t border-stone-100 dark:border-slate-700 pt-6 space-y-4">
            <h3 className="font-medium text-stone-800 dark:text-white text-sm">Leave a Review</h3>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Describe your experience (optional)…"
              className="w-full px-4 py-3 border border-stone-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm resize-none bg-white dark:bg-slate-700 text-stone-900 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500"
            />
            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
            >
              <Send size={14} />
              {submitting ? 'Submitting…' : 'Submit Review'}
            </button>
          </form>
        )
      ) : (
        <div className="border-t border-stone-100 dark:border-slate-700 pt-5 text-sm text-stone-500 dark:text-slate-400">
          <a href="/login" className="text-orange-500 hover:underline font-medium">Sign in</a> to leave a review.
        </div>
      )}
    </section>
  );
}
