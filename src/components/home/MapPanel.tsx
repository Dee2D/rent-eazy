'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
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

  return (
    <div className="relative w-full h-full">
      {/* Map */}
      <MapViewClient markers={allMarkers} height="100%" interactive theme={theme} />

      {/* Search overlay */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-col gap-2">
        <div className="flex gap-2 items-stretch">
          <div className="flex-1 min-w-0">
            <LocationSearch onFilterChange={handleFilterChange} loading={loading} />
          </div>
          <Link
            href="/properties"
            className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2.5 rounded-2xl shadow-md transition-colors whitespace-nowrap flex items-center"
          >
            Browse All
          </Link>
        </div>
      </div>

      {/* Searching toast */}
      {loading && (
        <div className="absolute top-[4.5rem] left-1/2 -translate-x-1/2 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-xl shadow-md px-4 py-2 text-xs font-medium text-stone-500 dark:text-slate-300 pointer-events-none">
          Searching…
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-6 left-3 z-10 bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm rounded-2xl shadow-md px-4 py-3 flex flex-col gap-1.5 border border-stone-100 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
          <span className="w-3 h-3 rounded-full bg-orange-500 shrink-0" />
          <span>Properties</span>
          <span className="ml-3 font-semibold text-stone-800 dark:text-white">{propertyMarkers.length}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-stone-600 dark:text-slate-300">
          <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
          <span>Providers</span>
          <span className="ml-3 font-semibold text-stone-800 dark:text-white">{providerMarkers.length}</span>
        </div>
      </div>
    </div>
  );
}
