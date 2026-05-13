'use client';

import Link from 'next/link';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export default function TermsCheckbox({ checked, onChange }: TermsCheckboxProps) {
  return (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative mt-0.5 shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
          required
        />
        {/* Custom checkbox — 24×24 for touch friendliness */}
        <div
          className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${
            checked
              ? 'bg-orange-500 border-orange-500'
              : 'bg-white dark:bg-slate-700 border-stone-300 dark:border-slate-500 group-hover:border-orange-400'
          }`}
        >
          {checked && (
            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 10" fill="none">
              <path d="M1 5l3.5 4L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>
      <span className="text-sm text-stone-600 dark:text-slate-400 leading-snug">
        I agree to the{' '}
        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Terms &amp; Conditions
        </Link>{' '}
        and{' '}
        <Link
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline font-medium"
          onClick={(e) => e.stopPropagation()}
        >
          Privacy Policy
        </Link>
        <span className="text-red-500 ml-1" aria-hidden>*</span>
      </span>
    </label>
  );
}
