'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import type { PropertyImage } from '@/types';

interface PropertyImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function PropertyImageGallery({ images, title }: PropertyImageGalleryProps) {
  const primaryIdx = images.findIndex((img) => img.is_primary);
  const [active, setActive] = useState(primaryIdx >= 0 ? primaryIdx : 0);
  const touchStartX = useRef<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="h-64 md:h-72 bg-orange-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-orange-200 dark:text-slate-600 text-7xl">
        🏠
      </div>
    );
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0 && active < images.length - 1) setActive(active + 1);
    if (delta > 0 && active > 0) setActive(active - 1);
  }

  return (
    <div className="space-y-2">
      <div
        className="relative h-64 md:h-96 rounded-2xl overflow-hidden bg-stone-100 dark:bg-slate-700 select-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <Image
          src={images[active].image_url}
          alt={`${title} — image ${active + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {/* Image counter badge */}
        {images.length > 1 && (
          <div className="absolute top-3 right-3 bg-black/50 text-white text-xs font-semibold px-2 py-1 rounded-lg">
            {active + 1} / {images.length}
          </div>
        )}
        {/* Swipe hint arrows on mobile */}
        {images.length > 1 && (
          <>
            {active > 0 && (
              <button
                onClick={() => setActive(active - 1)}
                aria-label="Previous image"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            {active < images.length - 1 && (
              <button
                onClick={() => setActive(active + 1)}
                aria-label="Next image"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white hover:bg-black/60 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </>
        )}
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative h-14 w-20 md:h-16 md:w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                i === active ? 'border-orange-500 opacity-100' : 'border-transparent opacity-60 hover:opacity-80'
              }`}
            >
              <Image src={img.image_url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
