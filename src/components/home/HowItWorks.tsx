'use client';

import { useState } from 'react';
import { Search, Eye, MessageCircle, Upload, CheckCircle, Zap } from 'lucide-react';

const TENANT_STEPS = [
  {
    icon: Search,
    title: 'Search & Filter',
    text: 'Browse properties by location, price, and type. Use our interactive map to explore visually.',
    color: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-500',
  },
  {
    icon: Eye,
    title: 'View Details',
    text: 'See photos, full descriptions, and exact location on the map for every property you like.',
    color: 'bg-sky-50 dark:bg-sky-900/20',
    iconColor: 'text-sky-500',
  },
  {
    icon: MessageCircle,
    title: 'Contact & Move In',
    text: 'Reach landlords directly via WhatsApp or our built-in messaging, then settle into your new home.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-500',
  },
];

const LANDLORD_STEPS = [
  {
    icon: Upload,
    title: 'Create a Listing',
    text: 'Add photos, set your price, and pin your property on the map — takes under 5 minutes.',
    color: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: Zap,
    title: 'Get Discovered',
    text: 'Your property appears on the map and in search results, visible to thousands of active tenants.',
    color: 'bg-orange-50 dark:bg-orange-900/20',
    iconColor: 'text-orange-500',
  },
  {
    icon: CheckCircle,
    title: 'Let Your Property',
    text: 'Receive inquiries, chat with tenants, and let your property stress-free from your dashboard.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-500',
  },
];

export default function HowItWorks() {
  const [tab, setTab] = useState<'tenant' | 'landlord'>('tenant');
  const steps = tab === 'tenant' ? TENANT_STEPS : LANDLORD_STEPS;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">

      <div className="text-center mb-8">
        <h2
          className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-white mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          How It Works
        </h2>
        <p className="text-stone-500 dark:text-slate-400 text-sm md:text-base mb-6">
          Simple steps to find your home or let your property
        </p>

        {/* Tab toggle */}
        <div className="inline-flex bg-stone-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setTab('tenant')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'tenant'
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200'
            }`}
          >
            I&apos;m a Tenant
          </button>
          <button
            onClick={() => setTab('landlord')}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === 'landlord'
                ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200'
            }`}
          >
            I&apos;m a Landlord
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={`${tab}-${i}`}
              className="relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-stone-100 dark:border-slate-700 shadow-sm"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${step.color}`}>
                <Icon size={22} className={step.iconColor} />
              </div>
              <span
                className="absolute top-5 right-5 text-5xl font-extrabold text-stone-100 dark:text-slate-700/60 select-none leading-none"
                style={{ fontFamily: 'var(--font-heading)' }}
                aria-hidden
              >
                {i + 1}
              </span>
              <h3
                className="font-bold text-stone-900 dark:text-white mb-2 relative z-10"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {step.title}
              </h3>
              <p className="text-stone-500 dark:text-slate-400 text-sm leading-relaxed">
                {step.text}
              </p>
            </div>
          );
        })}
      </div>

    </section>
  );
}
