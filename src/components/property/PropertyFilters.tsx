'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import type { PropertyFilters as Filters, PropertyType } from '@/types';
import { DISTRICTS } from '@/lib/constants';

const inputCls = 'w-full px-3 py-2.5 border border-stone-200 dark:border-slate-600 rounded-xl text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors';
const labelCls = 'block text-xs font-medium text-stone-600 dark:text-slate-400 mb-1';

export default function PropertyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isOpen, setIsOpen] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    district: searchParams.get('district') ?? '',
    area_name: searchParams.get('area_name') ?? '',
    min_price: searchParams.get('min_price') ? Number(searchParams.get('min_price')) : undefined,
    max_price: searchParams.get('max_price') ? Number(searchParams.get('max_price')) : undefined,
    bedrooms: searchParams.get('bedrooms') ? Number(searchParams.get('bedrooms')) : undefined,
    property_type: (searchParams.get('property_type') as PropertyType) ?? undefined,
  });

  const activeFilterCount = [
    filters.district,
    filters.area_name,
    filters.min_price,
    filters.max_price,
    filters.bedrooms,
    filters.property_type,
  ].filter(Boolean).length;

  function applyFilters() {
    const params = new URLSearchParams();
    if (filters.district) params.set('district', filters.district);
    if (filters.area_name) params.set('area_name', filters.area_name);
    if (filters.min_price) params.set('min_price', String(filters.min_price));
    if (filters.max_price) params.set('max_price', String(filters.max_price));
    if (filters.bedrooms) params.set('bedrooms', String(filters.bedrooms));
    if (filters.property_type) params.set('property_type', filters.property_type);
    router.push(`/properties?${params.toString()}`);
    setIsOpen(false);
  }

  function clearFilters() {
    setFilters({});
    router.push('/properties');
  }

  function handleDistrictChange(value: string) {
    setFilters({ ...filters, district: value, area_name: '' });
  }

  const filterBody = (
    <div className="space-y-4 pt-2">
      {/* District */}
      <div>
        <label className={labelCls}>District</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm leading-none pointer-events-none select-none">📍</span>
          <select
            value={filters.district ?? ''}
            onChange={(e) => handleDistrictChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 border border-stone-200 dark:border-slate-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-200 appearance-none cursor-pointer transition-colors"
          >
            <option value="">All Districts</option>
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 dark:text-slate-400 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Area */}
      <div>
        <label className={labelCls}>Area</label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-slate-500 pointer-events-none" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            value={filters.area_name ?? ''}
            onChange={(e) => setFilters({ ...filters, area_name: e.target.value })}
            disabled={!filters.district}
            placeholder={filters.district ? 'e.g. Ntinda, Kiwatule, Najjera' : 'Select a district first'}
            className="w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-slate-600 rounded-2xl text-sm bg-white dark:bg-slate-700 text-stone-900 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-50 dark:disabled:bg-slate-900/40 transition-colors"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className={labelCls}>Min Price (UGX)</label>
          <input type="number" placeholder="0" value={filters.min_price ?? ''} onChange={(e) => setFilters({ ...filters, min_price: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Max Price (UGX)</label>
          <input type="number" placeholder="Any" value={filters.max_price ?? ''} onChange={(e) => setFilters({ ...filters, max_price: e.target.value ? Number(e.target.value) : undefined })} className={inputCls} />
        </div>
      </div>

      <div>
        <label className={labelCls}>Bedrooms</label>
        <select value={filters.bedrooms ?? ''} onChange={(e) => setFilters({ ...filters, bedrooms: e.target.value ? Number(e.target.value) : undefined })} className={inputCls}>
          <option value="">Any</option>
          {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} bedroom{n > 1 ? 's' : ''}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls}>Property Type</label>
        <select value={filters.property_type ?? ''} onChange={(e) => setFilters({ ...filters, property_type: (e.target.value as PropertyType) || undefined })} className={inputCls}>
          <option value="">All Types</option>
          <option value="apartment">Apartment</option>
          <option value="house">House</option>
          <option value="bedsitter">Bedsitter</option>
        </select>
      </div>

      <div className="flex gap-2 pt-1">
        <button onClick={applyFilters} className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold py-3 rounded-xl transition-colors">
          Apply Filters
        </button>
        <button onClick={clearFilters} className="px-4 py-3 text-sm text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200 border border-stone-200 dark:border-slate-600 rounded-xl transition-colors">
          Clear
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-slate-800 border border-stone-100 dark:border-slate-700 rounded-2xl transition-colors duration-200">
      {/* Header — always visible, toggle on mobile */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-5 md:cursor-default"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={16} className="text-stone-500 dark:text-slate-400" />
          <h3 className="font-semibold text-stone-900 dark:text-white">Filter Properties</h3>
          {activeFilterCount > 0 && (
            <span className="bg-orange-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full leading-none">
              {activeFilterCount}
            </span>
          )}
        </div>
        <span className="md:hidden text-stone-400 dark:text-slate-500">
          {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>

      {/* Body — always visible on desktop, toggled on mobile */}
      <div className={`px-5 pb-5 ${isOpen ? 'block' : 'hidden md:block'}`}>
        {filterBody}
      </div>
    </div>
  );
}
