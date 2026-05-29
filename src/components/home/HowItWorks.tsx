'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Eye, MessageCircle, Upload, CheckCircle, Zap, Wrench, Star, PhoneCall } from 'lucide-react';

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

const CLIENT_STEPS = [
  {
    icon: Wrench,
    title: 'Browse by Category',
    text: 'Find plumbers, electricians, cleaners, painters, and more — filtered by your location.',
    color: 'bg-sky-50 dark:bg-sky-900/20',
    iconColor: 'text-sky-500',
  },
  {
    icon: Star,
    title: 'View Profiles & Ratings',
    text: 'Check photos, ratings, reviews, and service areas before you commit to anyone.',
    color: 'bg-amber-50 dark:bg-amber-900/20',
    iconColor: 'text-amber-500',
  },
  {
    icon: PhoneCall,
    title: 'Hire Directly',
    text: 'Reach providers instantly via WhatsApp or phone call — no middleman, no delay.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-500',
  },
];

const PROVIDER_STEPS = [
  {
    icon: Upload,
    title: 'Build Your Profile',
    text: 'Sign up, describe your services, add photos of your work, and set your service areas.',
    color: 'bg-sky-50 dark:bg-sky-900/20',
    iconColor: 'text-sky-500',
  },
  {
    icon: Zap,
    title: 'Show Up on the Map',
    text: 'Get discovered by customers actively searching for your type of service in your area.',
    color: 'bg-violet-50 dark:bg-violet-900/20',
    iconColor: 'text-violet-500',
  },
  {
    icon: Star,
    title: 'Grow Your Business',
    text: 'Earn reviews, build your reputation, and receive steady inquiries through your dashboard.',
    color: 'bg-emerald-50 dark:bg-emerald-900/20',
    iconColor: 'text-emerald-500',
  },
];

type Tab = 'tenant' | 'landlord' | 'client' | 'provider';

const TABS: { id: Tab; label: string; cta: { label: string; href: string } }[] = [
  { id: 'tenant',   label: "I'm a Tenant",          cta: { label: 'Browse Properties', href: '/properties' } },
  { id: 'landlord', label: "I'm a Landlord",         cta: { label: 'List a Property',   href: '/register' } },
  { id: 'client',   label: 'Looking for Services',   cta: { label: 'Find Services',     href: '/services' } },
  { id: 'provider', label: "I'm a Service Provider", cta: { label: 'Join as Provider',  href: '/register' } },
];

const STEPS: Record<Tab, typeof TENANT_STEPS> = {
  tenant:   TENANT_STEPS,
  landlord: LANDLORD_STEPS,
  client:   CLIENT_STEPS,
  provider: PROVIDER_STEPS,
};

export default function HowItWorks() {
  const [tab, setTab] = useState<Tab>('tenant');
  const steps = STEPS[tab];
  const activeCta = TABS.find((t) => t.id === tab)!.cta;

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
          Whether you&apos;re renting, letting, hiring, or offering — we&apos;ve got you covered
        </p>

        {/* Tab row — wraps on mobile */}
        <div className="inline-flex flex-wrap justify-center bg-stone-100 dark:bg-slate-800 rounded-xl p-1 gap-1">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                tab === id
                  ? 'bg-white dark:bg-slate-700 text-orange-500 shadow-sm'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
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

      {/* Contextual CTA under the steps */}
      <div className="mt-7 text-center">
        <Link
          href={activeCta.href}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-7 py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm text-sm"
        >
          {activeCta.label}
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

    </section>
  );
}
