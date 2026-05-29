import type { MapMarker, Property } from '@/types';
import MapPanel from './MapPanel';

interface MapSectionProps {
  initialProperties: Property[];
  providerMarkers: MapMarker[];
}

export default function MapSection({ initialProperties, providerMarkers }: MapSectionProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-10 md:py-14">
      <div className="text-center mb-7">
        <h2
          className="text-2xl md:text-3xl font-extrabold text-stone-900 dark:text-white mb-2"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Explore on the Map
        </h2>
        <p className="text-stone-500 dark:text-slate-400 text-sm md:text-base">
          Find properties and service providers near you, anywhere in Uganda
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-100 dark:border-slate-700 h-[460px] md:h-[560px]">
        <MapPanel initialProperties={initialProperties} providerMarkers={providerMarkers} />
      </div>
    </section>
  );
}
