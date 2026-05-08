'use client';

import { useState } from 'react';
import { Phone, MapPin, Search } from 'lucide-react';
import type { ServiceProvider, ServiceCategory } from '@/types';

const CATEGORY_ICONS: Record<string, string> = {
  Plumbing:           '🔧',
  Electrical:         '⚡',
  Cleaning:           '🧹',
  Security:           '🔒',
  Painting:           '🎨',
  Carpentry:          '🪵',
  'Moving & Delivery':'🚚',
  Gardening:          '🌿',
};

function ProviderCard({ provider }: { provider: ServiceProvider }) {
  const phone = provider.profiles?.phone_number;
  const category = provider.service_categories?.name ?? 'Services';
  const icon = CATEGORY_ICONS[category] ?? '🔧';

  const whatsapp = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on Rent Eazy and would like to inquire about your services.')}`
    : null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-3xl shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-stone-900 dark:text-white text-base leading-tight">
            {provider.profiles?.full_name ?? 'Service Provider'}
          </h3>
          <span className="inline-block mt-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2.5 py-0.5 rounded-full">
            {category}
          </span>
        </div>
      </div>

      {/* Description */}
      {provider.description && (
        <p className="text-sm text-stone-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
          {provider.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-stone-100 dark:border-slate-700">
        {phone ? (
          <span className="flex items-center gap-1.5 text-xs text-stone-400 dark:text-slate-500">
            <Phone size={12} />
            {phone}
          </span>
        ) : (
          <span />
        )}
        {whatsapp ? (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Phone size={14} />
            WhatsApp
          </a>
        ) : (
          <span className="text-xs text-stone-300 dark:text-slate-600">No contact info</span>
        )}
      </div>
    </div>
  );
}

interface ServicesClientProps {
  providers: ServiceProvider[];
  categories: ServiceCategory[];
}

export default function ServicesClient({ providers, categories }: ServicesClientProps) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = providers.filter((p) => {
    const matchesCategory =
      activeCategory === 'all' || p.service_categories?.name === activeCategory;
    const matchesSearch =
      !search ||
      (p.profiles?.full_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (p.service_categories?.name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Sidebar filters */}
      <aside className="w-full md:w-60 shrink-0 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 dark:text-slate-500" />
          <input
            type="search"
            placeholder="Search providers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-stone-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-stone-800 dark:text-white placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
          />
        </div>

        {/* Category filter */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-stone-100 dark:border-slate-700 p-4">
          <p className="text-xs font-semibold text-stone-400 dark:text-slate-500 uppercase tracking-wide mb-3">Category</p>
          <div className="space-y-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700'
              }`}
            >
              All Categories
              <span className="float-right text-xs opacity-70">{providers.length}</span>
            </button>
            {categories.map((cat) => {
              const count = providers.filter((p) => p.service_categories?.name === cat.name).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activeCategory === cat.name
                      ? 'bg-blue-500 text-white'
                      : 'text-stone-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span className="mr-2">{CATEGORY_ICONS[cat.name] ?? '🔧'}</span>
                  {cat.name}
                  <span className="float-right text-xs opacity-70">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Provider grid */}
      <main className="flex-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-stone-400 dark:text-slate-500">
            <span className="text-6xl mb-4">🔍</span>
            <p className="text-lg font-medium">No providers found</p>
            <p className="text-sm mt-1">Try adjusting your search or category</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-stone-400 dark:text-slate-500 mb-4">
              {filtered.length} provider{filtered.length !== 1 ? 's' : ''}
              {activeCategory !== 'all' ? ` in ${activeCategory}` : ''}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
