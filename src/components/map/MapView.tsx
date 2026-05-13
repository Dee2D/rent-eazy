'use client';

import { useEffect, useRef } from 'react';
import type mapboxgl from 'mapbox-gl';
import type { MapMarker } from '@/types';
import { createPropertyMarkerElement } from './PropertyMarker';
import { createProviderMarkerElement } from './ProviderMarker';

const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark:  'mapbox://styles/mapbox/dark-v11',
};

interface MapViewProps {
  markers: MapMarker[];
  height?: string;
  interactive?: boolean;
  theme?: 'light' | 'dark';
  flyTo?: [number, number] | null;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildPopupHtml(marker: MapMarker): string {
  const safeHref = marker.linkHref.startsWith('/') ? marker.linkHref : '#';
  const typeColor = marker.type === 'property' ? '#F97316' : '#3B82F6';

  return `
    <div style="font-family:system-ui,-apple-system,sans-serif;min-width:190px;max-width:230px">
      <div style="padding:12px 14px 0">
        <p style="font-weight:700;font-size:14px;margin:0 0 3px;color:#1c1917;line-height:1.35;word-break:break-word">${escapeHtml(marker.title)}</p>
        <p style="color:#78716c;font-size:12px;margin:0 0 10px;line-height:1.4">${escapeHtml(marker.subtitle)}</p>
      </div>
      <div style="padding:0 14px 12px">
        <a href="${escapeHtml(safeHref)}"
           style="display:block;background:${typeColor};color:white;text-align:center;padding:10px 12px;border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;letter-spacing:0.01em;-webkit-tap-highlight-color:transparent">
          View Details →
        </a>
      </div>
    </div>
  `;
}

export default function MapView({
  markers,
  height = '100vh',
  interactive = true,
  theme = 'light',
  flyTo = null,
}: MapViewProps) {
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
        attributionControl: false,
        pitchWithRotate: false,
      });

      mapRef.current = map;

      // Compact attribution (required by Mapbox ToS)
      map.addControl(new mapboxgl.AttributionControl({ compact: true }));

      if (interactive) {
        // Zoom buttons — bottom right, away from search overlay
        map.addControl(
          new mapboxgl.NavigationControl({ showCompass: false }),
          'bottom-right'
        );

        // Geolocate "Near Me" — bottom right, above zoom buttons
        map.addControl(
          new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false,
            showUserHeading: false,
          }),
          'bottom-right'
        );
      }

      map.on('load', () => {
        markers.forEach((marker) => {
          const el =
            marker.type === 'property'
              ? createPropertyMarkerElement()
              : createProviderMarkerElement();

          const popup = new mapboxgl.Popup({
            offset: 16,
            closeButton: true,
            closeOnClick: true,
            maxWidth: '240px',
          }).setHTML(buildPopupHtml(marker));

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

  // Switch style on theme change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setStyle(MAP_STYLES[theme]);
    }
  }, [theme]);

  // Fly to location on demand (e.g. "Near Me" from parent)
  useEffect(() => {
    if (mapRef.current && flyTo) {
      mapRef.current.flyTo({ center: flyTo, zoom: 14, duration: 1200 });
    }
  }, [flyTo]);

  return <div ref={mapContainerRef} style={{ height, width: '100%' }} />;
}
