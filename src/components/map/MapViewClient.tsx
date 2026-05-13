'use client';

import dynamic from 'next/dynamic';
import type { MapMarker } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-stone-100 dark:bg-slate-800">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

interface MapViewClientProps {
  markers: MapMarker[];
  interactive?: boolean;
  theme?: 'light' | 'dark';
  flyTo?: [number, number] | null;
}

export default function MapViewClient(props: MapViewClientProps) {
  return <MapView {...props} />;
}
