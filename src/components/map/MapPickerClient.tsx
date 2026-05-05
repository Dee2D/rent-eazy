'use client';

import dynamic from 'next/dynamic';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const MapPicker = dynamic(() => import('./MapPicker'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center bg-stone-100 rounded-xl" style={{ height: 280 }}>
      <LoadingSpinner size="lg" />
    </div>
  ),
});

interface MapPickerClientProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPickerClient(props: MapPickerClientProps) {
  return <MapPicker {...props} />;
}
