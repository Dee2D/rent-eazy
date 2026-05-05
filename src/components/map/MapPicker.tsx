'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';

interface MapPickerProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const callbackRef = useRef(onLocationChange);

  useEffect(() => {
    callbackRef.current = onLocationChange;
  });

  useEffect(() => {
    async function init() {
      const mapboxgl = (await import('mapbox-gl')).default;
      (mapboxgl as unknown as { accessToken: string }).accessToken =
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      if (!containerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 13,
      });

      mapRef.current = map;

      const marker = new mapboxgl.Marker({ color: '#F97316', draggable: true })
        .setLngLat([longitude, latitude])
        .addTo(map);

      markerRef.current = marker;

      marker.on('dragend', () => {
        const pos = marker.getLngLat();
        callbackRef.current(pos.lat, pos.lng);
      });

      map.on('click', (e) => {
        marker.setLngLat([e.lngLat.lng, e.lngLat.lat]);
        callbackRef.current(e.lngLat.lat, e.lngLat.lng);
      });
    }

    init();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync marker when coordinates are edited via number inputs
  useEffect(() => {
    markerRef.current?.setLngLat([longitude, latitude]);
  }, [latitude, longitude]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height: '280px', width: '100%', borderRadius: '12px', overflow: 'hidden' }}
      />
      <p className="text-xs text-stone-400 mt-2 flex items-center gap-1">
        <span>📍</span> Click on the map or drag the orange pin to set the exact location
      </p>
    </div>
  );
}
