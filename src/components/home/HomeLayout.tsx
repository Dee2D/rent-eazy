'use client';

import { useState } from 'react';
import { Map, Compass } from 'lucide-react';
import type { ReactNode } from 'react';

interface HomeLayoutProps {
  carousel: ReactNode;
  map: ReactNode;
}

export default function HomeLayout({ carousel, map }: HomeLayoutProps) {
  const [mobileView, setMobileView] = useState<'discover' | 'map'>('discover');

  return (
    <div className="relative flex flex-col md:flex-row h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Carousel panel — full height on mobile when active */}
      <div
        className={`w-full md:w-[40%] shrink-0 overflow-hidden md:border-r border-stone-100 dark:border-slate-800 md:shadow-lg md:z-10 ${
          mobileView === 'discover' ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {carousel}
      </div>

      {/* Map panel — full height on mobile when active */}
      <div
        className={`w-full md:flex-1 relative ${
          mobileView === 'map' ? 'flex' : 'hidden md:flex'
        } flex-col`}
      >
        {map}
      </div>

      {/* Mobile view toggle — floating pill above bottom nav */}
      <div className="md:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex bg-white dark:bg-slate-800 rounded-full shadow-lg border border-stone-100 dark:border-slate-700 p-1 gap-1">
        <button
          onClick={() => setMobileView('discover')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            mobileView === 'discover'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-stone-500 dark:text-slate-400'
          }`}
        >
          <Compass size={14} />
          Discover
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
            mobileView === 'map'
              ? 'bg-orange-500 text-white shadow-sm'
              : 'text-stone-500 dark:text-slate-400'
          }`}
        >
          <Map size={14} />
          Map
        </button>
      </div>
    </div>
  );
}
