'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const HERO_IMAGES = [
  { src: '/images/slides/slide-apartment.jpeg', alt: 'Modern apartment available for rent in Kampala' },
  { src: '/images/slides/slide-bungalow.jpeg', alt: 'Residential bungalow with garden for rent in Uganda' },
  { src: '/images/slides/slide-kyanja.jpeg', alt: 'Spacious house for rent in Kyanja, Kampala' },
  { src: '/images/slides/slide-namugongo.jpeg', alt: 'Rental property in Namugongo, Uganda' },
];

export default function HeroSection() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % HERO_IMAGES.length), 5500);
    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative min-h-[72vh] md:min-h-[78vh] flex items-center overflow-hidden">
      {/* Background image crossfade */}
      <AnimatePresence initial={false} mode="sync">
        <motion.div
          key={current}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeInOut' }}
        >
          <Image
            src={HERO_IMAGES[current].src}
            alt={HERO_IMAGES[current].alt}
            fill
            className="object-cover"
            priority={current === 0}
            sizes="100vw"
            quality={85}
          />
        </motion.div>
      </AnimatePresence>

      {/* Gradient stack — deep left shadow for text, warm bottom tint */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/20" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-amber-950/30 to-transparent" />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16 md:py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-2xl"
        >
          <span className="inline-block bg-orange-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-5 tracking-widest uppercase shadow-sm">
            Uganda&apos;s #1 Rental &amp; Services Platform
          </span>

          <h1
            className="text-4xl sm:text-5xl md:text-[3.4rem] font-extrabold text-white leading-[1.1] mb-5 drop-shadow-lg"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Find Homes &amp; Services<br />
            <span className="text-orange-400">Anywhere in Uganda</span>
          </h1>

          <p className="text-white/80 text-base md:text-lg leading-relaxed mb-8 max-w-lg">
            Browse rental properties, find trusted local service providers, or list your own — all in one place.
          </p>

          {/* Primary actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 max-w-xl">
            <Link
              href="/properties"
              className="flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Browse Properties
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/services"
              className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] text-sm"
            >
              Find a Service
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>

          {/* Join actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all text-sm"
            >
              List a Property
            </Link>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-semibold px-6 py-3 rounded-xl border border-white/30 hover:border-white/50 backdrop-blur-sm transition-all text-sm"
            >
              Offer Your Services
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 flex gap-2">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Switch to image ${i + 1}`}
            className={`transition-all duration-300 rounded-full ${
              i === current
                ? 'w-6 h-2 bg-orange-500'
                : 'w-2 h-2 bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
