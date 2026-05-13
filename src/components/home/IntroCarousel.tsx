'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Slide, { type SlideData } from './Slide';

const SLIDES: SlideData[] = [
  {
    id: 1,
    headline: 'All Your Rental Needs in One Place',
    text: 'Find a home, connect with service providers, and settle in—without the stress.',
    imageUrl: '/images/slides/slide-apartment.jpeg',
    imageAlt: 'Modern apartment building available for rent in Uganda',
    cta: { label: 'Explore the Map', href: '#map' },
    accent: 'bg-orange-500',
  },
  {
    id: 2,
    headline: 'Find a Home',
    text: 'Search by location, explore on the map, and discover homes that fit your lifestyle.',
    imageUrl: '/images/slides/slide-bungalow.jpeg',
    imageAlt: 'Ugandan starter bungalow with car and green lawn',
    cta: { label: 'Browse Properties', href: '/properties' },
    accent: 'bg-blue-500',
  },
  {
    id: 3,
    headline: 'List Your Property',
    text: 'Reach the right tenants faster and manage your listings effortlessly.',
    imageUrl: '/images/slides/slide-kyanja.jpeg',
    imageAlt: '6-bedroom house for sale in Kyanja, Kampala',
    cta: { label: 'List a Property', href: '/register' },
    accent: 'bg-emerald-500',
  },
  {
    id: 4,
    headline: 'Everything You Need, Right Where You Live',
    text: 'From plumbers to cleaners, find trusted service providers near your home.',
    imageUrl: '/images/slides/slide-services.jpeg',
    imageAlt: 'Professional service provider in Kampala, Uganda',
    cta: { label: 'Find Services', href: '/services' },
    accent: 'bg-purple-500',
  },
];

const INTERVAL = 6000;

interface IntroCarouselProps {
  stats: { properties: number; providers: number };
}

export default function IntroCarousel({ stats }: IntroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback((idx: number, dir: number) => {
    setDirection(dir);
    setCurrent(idx);
  }, []);

  const next = useCallback(() => go((current + 1) % SLIDES.length, 1), [current, go]);
  const prev = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length, -1), [current, go]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  return (
    <div
      className="relative flex flex-col h-full bg-white dark:bg-slate-900 select-none overflow-hidden transition-colors duration-200"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Brand header */}
      <div className="shrink-0 px-4 md:px-8 pt-5 md:pt-7 pb-3">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl font-extrabold leading-none tracking-tight" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            <span className="text-stone-900 dark:text-white">Rent </span>
            <span className="text-orange-500">Eazy</span>
          </p>
          <p className="text-[11px] text-stone-400 dark:text-slate-500 font-medium tracking-widest uppercase mt-0.5">
            Find. Rent. Live Easy.
          </p>
        </motion.div>
      </div>

      {/* Slide area */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <Slide key={current} slide={SLIDES[current]} direction={direction} />
        </AnimatePresence>
      </div>

      {/* Stats bar — links to full pages */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="shrink-0 mx-4 md:mx-8 mb-3 mt-1 grid grid-cols-2 gap-3"
      >
        <Link
          href="/properties"
          className="bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-2xl px-4 py-3 text-center transition-all hover:scale-[1.02] hover:shadow-md group"
        >
          <p className="text-2xl font-extrabold text-orange-500 group-hover:text-orange-600" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {stats.properties}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold mt-0.5">Active Listings</p>
        </Link>

        <Link
          href="/services"
          className="bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-2xl px-4 py-3 text-center transition-all hover:scale-[1.02] hover:shadow-md group"
        >
          <p className="text-2xl font-extrabold text-blue-500 group-hover:text-blue-600" style={{ fontFamily: 'var(--font-poppins), sans-serif' }}>
            {stats.providers}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold mt-0.5">Service Providers</p>
        </Link>
      </motion.div>

      {/* Dot indicators + arrows */}
      <div className="shrink-0 px-4 md:px-8 pb-5 md:pb-7 flex items-center justify-between">
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-100 dark:bg-slate-800">
        <div
          key={`${current}-${paused}`}
          className={`h-full bg-orange-400 ${paused ? 'w-0' : 'animate-progress'}`}
        />
      </div>
    </div>
  );
}
