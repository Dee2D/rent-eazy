'use client';

import { useState, useEffect } from 'react';
import { Map, Compass } from 'lucide-react';
import type { ReactNode } from 'react';

interface HomeLayoutProps {
  carousel: ReactNode;
  map: ReactNode;
}

export default function HomeLayout({ carousel, map }: HomeLayoutProps) {
  const [mobileView, setMobileView] = useState<'discover' | 'map'>('discover');
  // Lazy-mount: on mobile, don't render the map until the user opens the Map tab.
  // This prevents Mapbox from initialising inside a display:none container (0×0 dims).
  // On desktop both panels are always visible, so we mount immediately.
  const [mapMounted, setMapMounted] = useState(false);

  useEffect(() => {
    // Mount immediately on desktop (md ≥ 768px)
    if (window.innerWidth >= 768) setMapMounted(true);
  }, []);

  function handleShowMap() {
    setMobileView('map');
    setMapMounted(true);   // first tap → mount the map with correct visible dimensions
  }

  return (
    <div className="relative flex flex-col md:flex-row h-[calc(100dvh-8rem)] md:h-[calc(100dvh-4rem)] overflow-hidden">

      {/* ── Carousel panel ── */}
      <div
        className={`flex-col overflow-hidden
          md:flex md:flex-none md:w-[40%]
          md:border-r md:border-stone-100 md:dark:border-slate-800
          md:shadow-lg md:z-10
          ${mobileView === 'discover' ? 'flex flex-1' : 'hidden'}`}
      >
        {carousel}
      </div>

      {/* ── Map panel ── */}
      <div
        className={`flex-col relative
          md:flex md:flex-1
          ${mobileView === 'map' ? 'flex flex-1' : 'hidden'}`}
      >
        {/* Only render map once it will be visible — avoids 0×0 Mapbox init */}
        {mapMounted && map}
      </div>

      {/* ── Mobile toggle pill ── */}
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
          onClick={handleShowMap}
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
