'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Bed, Bath, ArrowLeft, Phone } from 'lucide-react';
import Slide, { type SlideData } from './Slide';
import { formatUGX, formatPeriod } from '@/lib/utils';
import type { Property, ServiceProvider } from '@/types';

const SLIDES: SlideData[] = [
  {
    id: 1,
    headline: 'All Your Rental Needs in One Place',
    text: 'Find a home, connect with service providers, and settle in—without the stress.',
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
    imageAlt: 'Happy family moving into a new home',
    cta: { label: 'Explore the Map', href: '#map' },
    accent: 'bg-orange-500',
  },
  {
    id: 2,
    headline: 'Find a Home Without the Hustle',
    text: 'Search by location, explore on the map, and discover homes that fit your lifestyle.',
    imageUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80',
    imageAlt: 'Happy tenants in a bright modern apartment',
    cta: { label: 'Browse Properties', href: '/properties' },
    accent: 'bg-blue-500',
  },
  {
    id: 3,
    headline: 'List Your Property with Ease',
    text: 'Reach the right tenants faster and manage your listings effortlessly.',
    imageUrl: 'https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800&q=80',
    imageAlt: 'Landlord showing a modern apartment',
    cta: { label: 'List a Property', href: '/register' },
    accent: 'bg-emerald-500',
  },
  {
    id: 4,
    headline: 'Everything You Need, Right Where You Live',
    text: 'From plumbers to cleaners, find trusted service providers near your home.',
    imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&q=80',
    imageAlt: 'Professional service provider at work',
    cta: { label: 'Find Services', href: '/properties' },
    accent: 'bg-purple-500',
  },
];

const INTERVAL = 6000;

type View = 'carousel' | 'listings' | 'services';

interface IntroCarouselProps {
  stats: { properties: number; providers: number };
  properties: Property[];
  providers: ServiceProvider[];
}

// ── Compact property card ─────────────────────────────────────────────────────
function PropertyItem({ property }: { property: Property }) {
  const img = property.property_images?.find((i) => i.is_primary) ?? property.property_images?.[0];
  return (
    <Link
      href={`/properties/${property.id}`}
      className="flex gap-3 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-slate-700/50 transition-colors group"
    >
      <div className="relative w-20 h-16 shrink-0 rounded-xl overflow-hidden bg-orange-100 dark:bg-slate-700">
        {img ? (
          <Image src={img.image_url} alt={property.title} fill className="object-cover" sizes="80px" />
        ) : (
          <div className="flex items-center justify-center h-full text-2xl">🏠</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 dark:text-white line-clamp-1 group-hover:text-orange-500 transition-colors">
          {property.title}
        </p>
        <div className="flex items-center gap-1 text-xs text-stone-400 dark:text-slate-500 mt-0.5">
          <MapPin size={10} />
          <span className="truncate">{property.area_name}, {property.district}</span>
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-stone-400 dark:text-slate-500">
          <span className="flex items-center gap-0.5"><Bed size={10} /> {property.bedrooms}</span>
          <span className="flex items-center gap-0.5"><Bath size={10} /> {property.bathrooms}</span>
          <span className="ml-auto font-semibold text-orange-500">
            {formatUGX(property.price_ugx)}<span className="font-normal text-stone-400">{formatPeriod(property.payment_period)}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

// ── Compact provider card ─────────────────────────────────────────────────────
function ProviderItem({ provider }: { provider: ServiceProvider }) {
  const phone = provider.profiles?.phone_number;
  const whatsapp = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I found you on Rent Eazy')}`
    : null;

  return (
    <div className="flex gap-3 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-slate-700/50 transition-colors">
      <div className="w-10 h-10 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-lg">
        🔧
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 dark:text-white line-clamp-1">
          {provider.profiles?.full_name ?? 'Service Provider'}
        </p>
        <span className="inline-block text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full mt-0.5">
          {provider.service_categories?.name ?? 'Services'}
        </span>
        {provider.description && (
          <p className="text-xs text-stone-400 dark:text-slate-500 mt-1 line-clamp-2">{provider.description}</p>
        )}
      </div>
      {whatsapp && (
        <a
          href={whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 p-2 rounded-xl bg-green-500 hover:bg-green-600 text-white transition-colors self-start"
          title="Contact on WhatsApp"
        >
          <Phone size={13} />
        </a>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function IntroCarousel({ stats, properties, providers }: IntroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const [view, setView] = useState<View>('carousel');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => go((current + 1) % SLIDES.length, 1), [current, go]);
  const prev = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length, -1), [current, go]);

  useEffect(() => {
    if (paused || view !== 'carousel') return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused, view]);

  function toggleView(v: View) {
    setView((prev) => (prev === v ? 'carousel' : v));
  }

  return (
    <div
      className="relative flex flex-col h-full bg-white dark:bg-slate-900 select-none overflow-hidden transition-colors duration-200"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Brand header */}
      <div className="shrink-0 px-8 pt-7 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 mb-1"
        >
          <div>
            <p className="text-xl font-extrabold leading-none tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
              <span className="text-stone-900 dark:text-white">Rent </span>
              <span className="text-orange-500">Eazy</span>
            </p>
            <p className="text-[11px] text-stone-400 dark:text-slate-500 font-medium tracking-widest uppercase mt-0.5">
              Find. Rent. Live Easy.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Main content area — carousel OR list panel */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {view === 'carousel' ? (
            <AnimatePresence initial={false} custom={direction} mode="popLayout" key="carousel">
              <Slide key={current} slide={SLIDES[current]} direction={direction} />
            </AnimatePresence>
          ) : (
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.22 }}
              className="absolute inset-0 flex flex-col"
            >
              {/* Panel header */}
              <div className="shrink-0 flex items-center gap-3 px-5 py-3 border-b border-stone-100 dark:border-slate-700">
                <button
                  onClick={() => setView('carousel')}
                  className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-700 text-stone-400 hover:text-stone-700 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-stone-800 dark:text-white">
                    {view === 'listings' ? 'Active Listings' : 'Service Providers'}
                  </p>
                  <p className="text-xs text-stone-400 dark:text-slate-500">
                    {view === 'listings' ? `${properties.length} available` : `${providers.length} active`}
                  </p>
                </div>
                {view === 'listings' && (
                  <Link
                    href="/properties"
                    className="ml-auto text-xs font-medium text-orange-500 hover:underline"
                  >
                    See all →
                  </Link>
                )}
              </div>

              {/* Scrollable list */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {view === 'listings' && (
                  properties.length === 0
                    ? <p className="text-center text-sm text-stone-400 dark:text-slate-500 py-12">No active listings yet.</p>
                    : properties.map((p) => <PropertyItem key={p.id} property={p} />)
                )}
                {view === 'services' && (
                  providers.length === 0
                    ? <p className="text-center text-sm text-stone-400 dark:text-slate-500 py-12">No service providers yet.</p>
                    : providers.map((p) => <ProviderItem key={p.id} provider={p} />)
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stats bar — clickable */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="shrink-0 mx-8 mb-4 mt-1 grid grid-cols-2 gap-3"
      >
        <button
          onClick={() => toggleView('listings')}
          className={`rounded-2xl px-4 py-3 text-center transition-all ${
            view === 'listings'
              ? 'bg-orange-500 shadow-md scale-[1.02]'
              : 'bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30'
          }`}
        >
          <p className={`text-2xl font-extrabold ${view === 'listings' ? 'text-white' : 'text-orange-500'}`}
            style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {stats.properties}
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${view === 'listings' ? 'text-orange-100' : 'text-stone-500 dark:text-slate-400'}`}>
            Active Listings
          </p>
        </button>

        <button
          onClick={() => toggleView('services')}
          className={`rounded-2xl px-4 py-3 text-center transition-all ${
            view === 'services'
              ? 'bg-blue-500 shadow-md scale-[1.02]'
              : 'bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'
          }`}
        >
          <p className={`text-2xl font-extrabold ${view === 'services' ? 'text-white' : 'text-blue-500'}`}
            style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {stats.providers}
          </p>
          <p className={`text-[11px] font-semibold mt-0.5 ${view === 'services' ? 'text-blue-100' : 'text-stone-500 dark:text-slate-400'}`}>
            Service Providers
          </p>
        </button>
      </motion.div>

      {/* Dot indicators + arrows (carousel only) */}
      {view === 'carousel' && (
        <div className="shrink-0 px-8 pb-7 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => go(i, i > current ? 1 : -1)}
                aria-label={`Go to slide ${i + 1}`}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? 'w-7 h-2.5 bg-orange-500'
                    : 'w-2.5 h-2.5 bg-stone-200 dark:bg-slate-700 hover:bg-stone-300 dark:hover:bg-slate-600'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={prev}
              aria-label="Previous slide"
              className="w-9 h-9 rounded-full border border-stone-200 dark:border-slate-700 flex items-center justify-center text-stone-400 dark:text-slate-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:border-orange-300 hover:text-orange-500 transition-all"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next slide"
              className="w-9 h-9 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white transition-all shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Progress bar (carousel only) */}
      {view === 'carousel' && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-100 dark:bg-slate-800">
          <div
            key={`${current}-${paused}`}
            className={`h-full bg-orange-400 ${paused ? 'w-0' : 'animate-progress'}`}
          />
        </div>
      )}
    </div>
  );
}
