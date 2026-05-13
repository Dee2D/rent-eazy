'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

export interface SlideData {
  id: number;
  headline: string;
  text: string;
  imageUrl: string;
  imageAlt: string;
  cta: { label: string; href: string };
  accent: string;
}

interface SlideProps {
  slide: SlideData;
  direction: number;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

const variants: Variants = {
  enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.55, ease: EASE } },
  exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0, transition: { duration: 0.4, ease: EASE } }),
};

export default function Slide({ slide, direction }: SlideProps) {
  return (
    <motion.div
      key={slide.id}
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      className="absolute inset-0 flex flex-col justify-between p-4 md:p-8"
    >
      {/* Image */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-lg flex-1 min-h-0 mb-6">
        <Image
          src={slide.imageUrl}
          alt={slide.imageAlt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 40vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
      </div>

      {/* Text content */}
      <div className="shrink-0">
        <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3 text-white ${slide.accent}`}>
          {['For Everyone', 'For Tenants', 'For Landlords', 'Services'][slide.id - 1]}
        </span>
        <h2
          className="text-xl md:text-3xl font-extrabold text-stone-900 dark:text-white leading-tight mb-2"
          style={{ fontFamily: 'var(--font-poppins), sans-serif' }}
        >
          {slide.headline}
        </h2>
        <p className="text-stone-500 dark:text-slate-400 text-sm md:text-base leading-relaxed mb-5">
          {slide.text}
        </p>
        <Link
          href={slide.cta.href}
          className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shadow-md"
        >
          {slide.cta.label}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </motion.div>
  );
}
