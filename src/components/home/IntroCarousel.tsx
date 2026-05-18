'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import Slide, { type SlideData } from './Slide';

// ── Slide definitions ──────────────────────────────────────────────────────────
// focalPoint: CSS object-position — controls which part of the image stays visible
// when the landscape image is cropped into the portrait panel.
//   "center 30%" → aligns the 30%-from-top point with container centre → shows upper building
//   "center 50%" → true centre crop
const SLIDES: SlideData[] = [
  {
    id: 1,
    badge: "Uganda's #1 Rental Platform",
    headline: 'All your housing needs in one place',
    text: 'Find a home, connect with local services, and settle in — without the stress.',
    imageUrl: '/images/slides/slide-apartment.jpeg',
    imageAlt: 'Modern apartment building available for rent in Kampala, Uganda',
    // Near-square image (736×744) — slight top bias keeps roofline visible
    focalPoint: 'center 30%',
    cta: { label: 'Explore the Map', href: '#map' },
    accent: 'bg-orange-500',
    priority: true, // ← LCP — preload immediately, all others lazy
  },
  {
    id: 2,
    badge: 'For Tenants',
    headline: 'Tenants easily find homes',
    text: 'Search by location, explore on the map, and discover homes that fit your life.',
    imageUrl: '/images/slides/slide-bungalow.jpeg',
    imageAlt: 'Residential bungalow with garden available for rent in Uganda',
    // Landscape 4:3 (736×552) — upper-centre keeps house facade and lawn visible
    focalPoint: 'center 42%',
    cta: { label: 'Browse Properties', href: '/properties' },
    accent: 'bg-sky-500',
    priority: false,
  },
  {
    id: 3,
    badge: 'For Landlords',
    headline: 'Landlords easily let properties',
    text: 'Reach the right tenants faster and manage your listings effortlessly.',
    imageUrl: '/images/slides/slide-kyanja.jpeg',
    imageAlt: 'Spacious house for rent in Kyanja, Kampala Uganda',
    // Landscape 3:2 (735×493) — upper-centre preserves roofline
    focalPoint: 'center 35%',
    cta: { label: 'List a Property', href: '/register' },
    accent: 'bg-emerald-500',
    priority: false,
  },
  {
    id: 4,
    badge: 'Local Services',
    headline: 'Services around you made simple',
    text: 'From plumbers to cleaners, find trusted providers right near your home.',
    imageUrl: '/images/slides/slide-services.jpeg',
    imageAlt: 'Professional service provider in a Ugandan residential neighbourhood',
    // Landscape 3:2 (735×490) — centred, subject is mid-frame
    focalPoint: 'center 45%',
    cta: { label: 'Find Services', href: '/services' },
    accent: 'bg-violet-500',
    priority: false,
  },
];

const INTERVAL = 6000;

interface IntroCarouselProps {
  stats: { properties: number; providers: number };
}

export default function IntroCarousel({ stats }: IntroCarouselProps) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Lightweight swipe detection — no extra library needed
  const swipeRef = useRef<{ x: number; t: number } | null>(null);

  const go = useCallback((idx: number) => {
    setCurrent(idx);
  }, []);

  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go]);
  const prev = useCallback(() => go((current - 1 + SLIDES.length) % SLIDES.length), [current, go]);

  useEffect(() => {
    if (paused) return;
    timerRef.current = setInterval(next, INTERVAL);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [next, paused]);

  // Pointer-based swipe — works for both touch and mouse drag
  function onPointerDown(e: React.PointerEvent) {
    swipeRef.current = { x: e.clientX, t: Date.now() };
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.x;
    const dt = Date.now() - swipeRef.current.t;
    swipeRef.current = null;
    // Swipe threshold: 40px in under 400ms
    if (Math.abs(dx) > 40 && dt < 400) {
      dx < 0 ? next() : prev();
    }
  }

  return (
    <div
      className="relative flex flex-col h-full select-none overflow-hidden transition-colors duration-200"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* ── Subtle Ugandan-inspired background pattern ── */}
      {/* Diamond lattice + housing glyphs at very low opacity — visible in gaps around the slide card */}
      <div
        className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06] pointer-events-none"
        style={{ backgroundImage: 'url(/patterns/bg-pattern.svg)', backgroundSize: '200px 200px' }}
        aria-hidden
      />
      {/* Base fill so pattern doesn't show through slide card gaps */}
      <div className="absolute inset-0 bg-white dark:bg-slate-900 -z-10" />

      {/* ── Brand header ── */}
      <div className="shrink-0 px-5 md:px-8 pt-5 md:pt-7 pb-2">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
        >
          <p className="text-xl font-extrabold leading-none tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
            <span className="text-stone-900 dark:text-white">Rent </span>
            <span className="text-orange-500">Eazy</span>
          </p>
          <p className="text-[11px] text-stone-400 dark:text-slate-500 font-semibold tracking-widest uppercase mt-0.5">
            Find. Rent. Live Easy.
          </p>
        </motion.div>
      </div>

      {/* ── Slide area — fills remaining vertical space ── */}
      {/* No padding here: the Slide component itself uses absolute inset-4/5 for the card margin */}
      <div
        className="relative flex-1 min-h-0 cursor-grab active:cursor-grabbing"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        {/* mode="sync": entering & exiting slides overlap during crossfade.
            The new slide renders later in the DOM → higher stacking → fades in on top. */}
        <AnimatePresence initial={false} mode="sync">
          <Slide key={current} slide={SLIDES[current]} />
        </AnimatePresence>
      </div>

      {/* ── Stats bar — links to full pages ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="shrink-0 px-5 md:px-8 pt-3 pb-2 grid grid-cols-2 gap-3"
      >
        <Link
          href="/properties"
          className="group bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 border border-orange-100 dark:border-orange-800/30 rounded-2xl px-4 py-3 text-center transition-all hover:scale-[1.02] hover:shadow-md"
        >
          <p className="text-2xl font-extrabold text-orange-500 group-hover:text-orange-600 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.properties}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold mt-0.5">Active Listings</p>
        </Link>
        <Link
          href="/services"
          className="group bg-sky-50 dark:bg-sky-900/20 hover:bg-sky-100 dark:hover:bg-sky-900/30 border border-sky-100 dark:border-sky-800/30 rounded-2xl px-4 py-3 text-center transition-all hover:scale-[1.02] hover:shadow-md"
        >
          <p className="text-2xl font-extrabold text-sky-500 group-hover:text-sky-600 transition-colors" style={{ fontFamily: 'var(--font-heading)' }}>
            {stats.providers}
          </p>
          <p className="text-[11px] text-stone-500 dark:text-slate-400 font-semibold mt-0.5">Service Providers</p>
        </Link>
      </motion.div>

      {/* ── Dot indicators + prev/next arrows ── */}
      <div className="shrink-0 px-5 md:px-8 pb-5 md:pb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
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

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-100 dark:bg-slate-800">
        <div
          key={`${current}-${paused}`}
          className={`h-full bg-orange-400 ${paused ? 'w-0' : 'animate-progress'}`}
        />
      </div>
    </div>
  );
}
