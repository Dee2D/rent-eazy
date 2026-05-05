'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PropertyImage } from '@/types';

interface PropertyImageGalleryProps {
  images: PropertyImage[];
  title: string;
}

export default function PropertyImageGallery({ images, title }: PropertyImageGalleryProps) {
  const primaryIdx = images.findIndex((img) => img.is_primary);
  const [active, setActive] = useState(primaryIdx >= 0 ? primaryIdx : 0);

  if (images.length === 0) {
    return (
      <div className="h-72 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-200 text-7xl">
        🏠
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden bg-stone-100">
        <Image
          src={images[active].image_url}
          alt={`${title} — image ${active + 1}`}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`relative h-16 w-24 shrink-0 rounded-xl overflow-hidden border-2 transition-colors ${
                i === active ? 'border-orange-500' : 'border-transparent'
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
