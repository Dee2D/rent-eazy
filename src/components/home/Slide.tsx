'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface SlideData {
  id: number;
  badge: string;
  headline: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  /** CSS object-position value — controls focal point to prevent cropping key subjects */
  focalPoint: string;
  cta: { label: string; href: string };
  accent: string;
  priority: boolean;
}

interface SlideProps {
  slide: SlideData;
}

export default function Slide({ slide }: SlideProps) {
  return (
    // Full-bleed card: fills the slide area with margin for rounding
    // Pure opacity crossfade — no positional animation prevents the "sliding half-image" crop bug
    <motion.div
      className="absolute inset-4 md:inset-5 rounded-2xl overflow-hidden shadow-xl shadow-black/20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.65, ease: 'easeInOut' }}
    >
      {/* Full-bleed image — no extra positional animation, crossfade handled by parent */}
      <Image
        src={slide.imageUrl}
        alt={slide.imageAlt}
        fill
        className="object-cover"
        style={{ objectPosition: slide.focalPoint }}
        sizes="(max-width: 768px) 100vw, 40vw"
        priority={slide.priority}
        quality={85}
      />

      {/* Gradient stack: cinematic bottom-heavy for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/5" />
      {/* Warm amber undertone — matches Ugandan sun/brand palette */}
      <div className="absolute bottom-0 inset-x-0 h-3/5 bg-gradient-to-t from-amber-950/35 to-transparent" />

      {/* Text overlaid at bottom — enters after image with staggered y-rise */}
      <motion.div
        className="absolute inset-x-0 bottom-0 p-5 md:p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3 text-white ${slide.accent} shadow-sm tracking-wide`}>
          {slide.badge}
        </span>
        <h2
          className="text-[1.3rem] md:text-2xl font-extrabold text-white leading-tight mb-2 drop-shadow-md"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {slide.headline}
        </h2>
        <p className="text-white/75 text-sm leading-relaxed mb-4 max-w-xs">
          {slide.text}
        </p>
        <Link
          href={slide.cta.href}
          className="inline-flex items-center gap-2 bg-white hover:bg-orange-50 text-stone-900 text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
        >
          {slide.cta.label}
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </motion.div>
    </motion.div>
  );
}
