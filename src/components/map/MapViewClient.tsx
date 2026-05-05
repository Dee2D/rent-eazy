'use client';

import dynamic from 'next/dynamic';
import type { MapMarker } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-stone-100 dark:bg-slate-800 h-full w-full">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

interface MapViewClientProps {
  markers: MapMarker[];
  height?: string;
  interactive?: boolean;
  theme?: 'light' | 'dark';
}

export default function MapViewClient(props: MapViewClientProps) {
  return <MapView {...props} />;
}
