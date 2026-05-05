'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { MapMarker } from '@/types';
import { createPropertyMarkerElement } from './PropertyMarker';
import { createProviderMarkerElement } from './ProviderMarker';

const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

interface MapViewProps {
  markers: MapMarker[];
  height?: string;
  interactive?: boolean;
  theme?: 'light' | 'dark';
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function MapView({ markers, height = '100vh', interactive = true, theme = 'light' }: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    async function initMap() {
      const mapboxgl = (await import('mapbox-gl')).default;
      (mapboxgl as unknown as { accessToken: string }).accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

      if (!mapContainerRef.current || mapRef.current) return;

      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLES[theme],
        center: [32.5899, 0.3476],
        zoom: 12,
        interactive,
      });

      mapRef.current = map;

      map.on('load', () => {
        markers.forEach((marker) => {
          const el =
            marker.type === 'property'
              ? createPropertyMarkerElement()
              : createProviderMarkerElement();

          const subtitle = marker.subtitle;

          const safeHref = marker.linkHref.startsWith('/') ? marker.linkHref : '#';
          const popup = new mapboxgl.Popup({ offset: 12, closeButton: false }).setHTML(`
            <div style="font-family:sans-serif;padding:4px;min-width:160px">
              <p style="font-weight:700;font-size:13px;margin:0 0 4px">${escapeHtml(marker.title)}</p>
              <p style="color:#78716c;font-size:12px;margin:0 0 8px">${escapeHtml(subtitle)}</p>
              <a href="${escapeHtml(safeHref)}" style="color:#F97316;font-size:12px;font-weight:600;text-decoration:none">View Details →</a>
            </div>
          `);

          new mapboxgl.Marker({ element: el })
            .setLngLat([marker.longitude, marker.latitude])
            .setPopup(popup)
            .addTo(map);
        });
      });
    }

    initMap();

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [markers, interactive]); // eslint-disable-line react-hooks/exhaustive-deps

  // Switch Mapbox style when theme changes (without re-initialising the map)
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[theme]);
    }
  }, [theme]);

  return <div ref={mapContainerRef} style={{ height, width: '100%' }} />;
}
