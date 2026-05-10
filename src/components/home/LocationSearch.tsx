'use client';

import { useState, useEffect, useRef } from 'react';

const DISTRICTS = [
  'Kampala', 'Wakiso', 'Mukono', 'Entebbe', 'Jinja',
  'Mbarara', 'Gulu', 'Lira', 'Masaka', 'Fort Portal',
];
const DEBOUNCE_MS = 400;

interface LocationSearchProps {
  onFilterChange: (district: string, area: string) => void;
  loading?: boolean;
}

export default function LocationSearch({ onFilterChange, loading }: LocationSearchProps) {
  const [district, setDistrict] = useState('');
  const [area, setArea] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleDistrictChange = (value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setDistrict(value);
    setArea('');
    onFilterChange(value, '');
  };

  const handleAreaChange = (value: string) => {
    setArea(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChange(district, value);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    setDistrict('');
    setArea('');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onFilterChange('', '');
  };

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const hasFilter = district || area;

  const inputBase = 'w-full py-2.5 rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-stone-200 dark:border-slate-600 text-sm text-stone-700 dark:text-slate-200 shadow-sm focus:outline-none focus:border-orange-400 dark:focus:border-orange-500 focus:ring-1 focus:ring-orange-300 dark:focus:ring-orange-500/30 transition-colors';

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full">
      {/* District selector */}
      <div className="relative flex-1 min-w-0">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-none pointer-events-none select-none">📍</span>
        <select
          value={district}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={`${inputBase} pl-9 pr-8 appearance-none cursor-pointer`}
        >
          <option value="">Select district...</option>
          {DISTRICTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Area free-text input */}
      <div className="relative flex-1 min-w-0">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>
        <input
          type="text"
          value={area}
          onChange={(e) => handleAreaChange(e.target.value)}
          disabled={!district}
          placeholder={district ? 'Enter area (e.g. Ntinda, Kiwatule, Najjera)' : 'Select a district first'}
          className={`${inputBase} pl-9 pr-4 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-50/95 dark:disabled:bg-slate-900/60`}
        />
        {loading && (
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-400 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        )}
      </div>

      {/* Clear button */}
      {hasFilter && (
        <button
          onClick={handleClear}
          aria-label="Clear filters"
          className="shrink-0 w-10 h-10 flex items-center justify-center rounded-2xl bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-stone-200 dark:border-slate-600 text-stone-500 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-700 hover:text-red-500 shadow-sm transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
