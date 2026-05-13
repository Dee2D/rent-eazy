'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { Navigation } from 'lucide-react';
import type { MapMarker, Property } from '@/types';
import { formatUGX, formatPeriod } from '@/lib/utils';
import MapViewClient from '@/components/map/MapViewClient';
import LocationSearch from './LocationSearch';
import { getFilteredPropertiesClient } from '@/lib/supabase/properties-client';
import { useTheme } from '@/hooks/useTheme';

interface MapPanelProps {
  initialProperties: Property[];
  providerMarkers: MapMarker[];
}

function propertiesToMarkers(properties: Property[]): MapMarker[] {
  return properties.map((p) => ({
    id: p.id,
    latitude: p.latitude,
    longitude: p.longitude,
    type: 'property' as const,
    title: p.title,
    subtitle: `${formatUGX(p.price_ugx)}${formatPeriod(p.payment_period)}`,
    linkHref: `/properties/${p.id}`,
  }));
}

export default function MapPanel({ initialProperties, providerMarkers }: MapPanelProps) {
  const { theme } = useTheme();
  const [propertyMarkers, setPropertyMarkers] = useState<MapMarker[]>(
    () => propertiesToMarkers(initialProperties)
  );
  const [loading, setLoading] = useState(false);
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const allMarkers = [...propertyMarkers, ...providerMarkers];

  const handleFilterChange = useCallback(async (district: string, area: string) => {
    if (!district && !area) {
      setPropertyMarkers(propertiesToMarkers(initialProperties));
      return;
    }
    setLoading(true);
    try {
      const filtered = await getFilteredPropertiesClient(
        district || undefined,
        area || undefined
      );
      setPropertyMarkers(propertiesToMarkers(filtered));
    } catch {
      // keep current markers on error
    } finally {
      setLoading(false);
    }
  }, [initialProperties]);

  function handleNearMe() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTo([pos.coords.longitude, pos.coords.latitude]);
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <MapViewClient markers={allMarkers} height="100%" interactive theme={theme} flyTo={flyTo} />

      {/* Search overlay — compact on mobile */}
      <div className="absolute top-3 left-3 right-3 z-10 space-y-2">
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 min-w-0">
            <LocationSearch onFilterChange={handleFilterChange} loading={loading} />
          </div>
          <Link
            href="/properties"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-3 md:px-4 py-2.5 rounded-2xl shadow-md transition-colors whitespace-nowrap flex items-center"
          >
            <span className="hidden sm:inline">Browse All</span>
            <span className="sm:hidden">All</span>
          </Link>
        </div>
      </div>

      {/* Searching toast */}
      {loading && (
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-md px-4 py-2 text-xs font-medium text-stone-500 dark:text-slate-300 pointer-events-none">
          Searching…
        </div>
      )}

      {/* Bottom-right controls area — Near Me + Legend */}
      <div className="absolute bottom-6 left-3 z-10 flex flex-col gap-2">
        {/* Near Me button */}
        <button
          onClick={handleNearMe}
          disabled={locating}
          aria-label="Find properties near me"
          className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm border border-stone-100 dark:border-slate-700 shadow-md px-3 py-2 rounded-2xl text-xs font-semibold text-stone-700 dark:text-slate-200 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600 hover:border-orange-200 transition-colors disabled:opacity-60"
        >
          <Navigation size={13} className={locating ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'Near Me'}</span>
        </button>

        {/* Legend */}
        <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-md px-3 py-2.5 flex flex-col gap-1.5 border border-stone-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" />
            <span>Properties</span>
            <span className="ml-auto font-semibold text-stone-800 dark:text-white">{propertyMarkers.length}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
            <span>Providers</span>
            <span className="ml-auto font-semibold text-stone-800 dark:text-white">{providerMarkers.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
